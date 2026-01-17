import WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TrackConfig {
  id: string;
  name: string;
  websocket: string;
}

const TRACKS: TrackConfig[] = [
  { id: 'max60', name: 'Max60', websocket: 'wss://www.apex-timing.com:9703/' },
  { id: 'slovakiaring', name: 'Slovakiaring', websocket: 'wss://www.apex-timing.com:8533/' }
];

interface KartStats {
  kartNumber: string;
  kartClass: string;
  bestLapTime: number;
  bestLapDisplay: string;
  allLapTimes: number[];
  lapCount: number;
  averageLapTime: number;
  lastDriver: string;
  bestLapDriver: string;
}

class TrackMonitor {
  private trackId: string;
  private trackName: string;
  private websocketUrl: string;
  private ws: WebSocket | null = null;
  private driversMap: Map<string, any> = new Map();
  private kartStatsMap: Map<string, KartStats> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 5000; // 5 seconds

  constructor(config: TrackConfig) {
    this.trackId = config.id;
    this.trackName = config.name;
    this.websocketUrl = config.websocket;
  }

  start() {
    this.connect();
  }

  private connect() {
    try {
      this.log('Connecting...');
      this.ws = new WebSocket(this.websocketUrl);

      this.ws.on('open', () => {
        this.log('✅ Connected');
        this.reconnectDelay = 5000; // Reset delay on successful connection
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = data.toString();
          this.processMessages(message);
        } catch (error) {
          this.log(`Error processing message: ${error}`);
        }
      });

      this.ws.on('error', (error) => {
        this.log(`❌ WebSocket error: ${error.message}`);
      });

      this.ws.on('close', () => {
        this.log('⚠️ Disconnected. Reconnecting...');
        this.scheduleReconnect();
      });
    } catch (error) {
      this.log(`❌ Connection error: ${error}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 60000); // Max 1 minute
      this.connect();
    }, this.reconnectDelay);
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString('hu-HU');
    console.log(`[${timestamp}] [${this.trackName}] ${message}`);
  }

  private parseLapTimeToMs(timeStr: string): number {
    if (!timeStr || timeStr === '-') return Infinity;
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return (minutes * 60 + seconds) * 1000;
    }
    
    const seconds = parseFloat(timeStr);
    if (isNaN(seconds)) return Infinity;
    return seconds * 1000;
  }

  private async recordKartLapTime(kartNumber: string, kartClass: string, lapTimeStr: string, driverName: string) {
    if (!kartNumber || !lapTimeStr || lapTimeStr === '-') return;
    
    const lapTimeMs = this.parseLapTimeToMs(lapTimeStr);
    if (lapTimeMs === Infinity) return;
    
    await this.sendLapTimeToDatabase(kartNumber, kartClass, lapTimeMs, lapTimeStr, driverName);
    
    // Update in-memory stats
    let stats = this.kartStatsMap.get(kartNumber);
    
    if (!stats) {
      stats = {
        kartNumber,
        kartClass,
        bestLapTime: lapTimeMs,
        bestLapDisplay: lapTimeStr,
        allLapTimes: [lapTimeMs],
        lapCount: 1,
        averageLapTime: lapTimeMs,
        lastDriver: driverName,
        bestLapDriver: driverName,
      };
    } else {
      const lastTime = stats.allLapTimes[stats.allLapTimes.length - 1];
      if (lastTime !== lapTimeMs) {
        stats.allLapTimes.push(lapTimeMs);
        stats.lapCount = stats.allLapTimes.length;
        stats.averageLapTime = stats.allLapTimes.reduce((a, b) => a + b, 0) / stats.lapCount;
        
        if (lapTimeMs < stats.bestLapTime) {
          stats.bestLapTime = lapTimeMs;
          stats.bestLapDisplay = lapTimeStr;
          stats.bestLapDriver = driverName;
        }
      }
      stats.kartClass = kartClass || stats.kartClass;
      stats.lastDriver = driverName || stats.lastDriver;
    }
    
    this.kartStatsMap.set(kartNumber, stats);
  }

  private async sendLapTimeToDatabase(kartNumber: string, kartClass: string, timeMs: number, timeDisplay: string, driverName: string) {
    try {
      // Find or create kart
      let kart = await prisma.kart.findUnique({ 
        where: { 
          kartNumber_trackId: { kartNumber, trackId: this.trackId }
        } 
      });
      
      if (!kart) {
        kart = await prisma.kart.create({
          data: { kartNumber, kartClass: kartClass || null, trackId: this.trackId }
        });
      }

      // Find or create driver
      let driver = await prisma.driver.findUnique({ 
        where: { 
          name_trackId: { name: driverName, trackId: this.trackId }
        } 
      });
      
      if (!driver) {
        driver = await prisma.driver.create({
          data: { name: driverName, trackId: this.trackId }
        });
      }

      // Save lap time
      await prisma.lapTime.create({
        data: {
          timeMs: Math.round(timeMs),
          timeDisplay,
          trackId: this.trackId,
          kartId: kart.id,
          driverId: driver.id
        }
      });

      // Update or create best lap record
      const existingBest = await prisma.kartBestLap.findUnique({
        where: { 
          kartNumber_trackId: { kartNumber, trackId: this.trackId }
        }
      });

      if (!existingBest) {
        await prisma.kartBestLap.create({
          data: {
            kartNumber,
            kartClass: kartClass || null,
            trackId: this.trackId,
            bestLapTime: Math.round(timeMs),
            bestLapDisplay: timeDisplay,
            bestLapDriver: driverName,
            lapCount: 1
          }
        });
        this.log(`🆕 New kart: #${kartNumber} - ${driverName}: ${timeDisplay}`);
      } else {
        const updateData: any = {
          lapCount: existingBest.lapCount + 1
        };

        if (timeMs < existingBest.bestLapTime) {
          updateData.bestLapTime = Math.round(timeMs);
          updateData.bestLapDisplay = timeDisplay;
          updateData.bestLapDriver = driverName;
          this.log(`⚡ New best lap: #${kartNumber} - ${driverName}: ${timeDisplay}`);
        }

        if (kartClass) {
          updateData.kartClass = kartClass;
        }

        await prisma.kartBestLap.update({
          where: { 
            kartNumber_trackId: { kartNumber, trackId: this.trackId }
          },
          data: updateData
        });
      }
    } catch (error) {
      this.log(`❌ Database error: ${error}`);
    }
  }

  private parseGrid(html: string) {
    // Simple HTML parsing - extract driver data
    const rowRegex = /<tr[^>]*data-id="(r\d+)"[^>]*data-pos="(\d+)"[^>]*>(.*?)<\/tr>/gs;
    const matches = html.matchAll(rowRegex);
    
    for (const match of matches) {
      const driverId = match[1];
      const position = parseInt(match[2]);
      const rowContent = match[3];
      
      if (driverId === 'r0') continue; // Skip header
      
      // Extract cells
      const kartMatch = rowContent.match(/data-id="[^"]*c4"[^>]*>([^<]*)</);
      const nameMatch = rowContent.match(/data-id="[^"]*c5"[^>]*>([^<]*)</);
      const bestLapMatch = rowContent.match(/data-id="[^"]*c11"[^>]*>([^<]*)</);
      const kartClassMatch = rowContent.match(/class="([^"]*)"[^>]*data-id="[^"]*c4"/);
      
      const kartNumber = kartMatch ? kartMatch[1].trim() : '';
      const driverName = nameMatch ? nameMatch[1].trim() : '';
      const bestLap = bestLapMatch ? bestLapMatch[1].trim() : '';
      const kartClass = kartClassMatch ? kartClassMatch[1].trim() : '';
      
      if (kartNumber && driverName && bestLap && bestLap !== '-') {
        this.recordKartLapTime(kartNumber, kartClass, bestLap, driverName);
      }
      
      // Store driver in map
      this.driversMap.set(driverId, {
        id: driverId,
        position,
        kartNumber,
        name: driverName,
        bestLap
      });
    }
  }

  private updateCell(msg: string) {
    const match = msg.match(/^(r\d+)(c\d+)\|([^|]*)\|?(.*)$/);
    if (!match) return;
    
    const [, driverId, cellId, cssClass, value] = match;
    const driver = this.driversMap.get(driverId);
    if (!driver) return;
    
    const cellNum = parseInt(cellId.replace('c', ''));
    
    if (cellNum === 11 && value) {
      // Best lap updated
      driver.bestLap = value;
      if (driver.kartNumber && driver.name) {
        this.recordKartLapTime(driver.kartNumber, cssClass, value, driver.name);
      }
    } else if (cellNum === 4 && value) {
      driver.kartNumber = value;
    } else if (cellNum === 5 && value) {
      driver.name = value;
    }
  }

  private processMessages(data: string) {
    const messages = data.split('\n').filter(msg => msg.trim());
    
    messages.forEach(msg => {
      if (msg.startsWith('init|')) {
        this.driversMap.clear();
        this.log('🔄 Init received - clearing data');
      } else if (msg.startsWith('grid||')) {
        const html = msg.substring(6);
        this.parseGrid(html);
      } else if (msg.match(/^r\d+c\d+\|/)) {
        this.updateCell(msg);
      }
    });
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Main worker process
export async function startWorker() {
  console.log('');
  console.log(`✅ Monitoring ${TRACKS.length} tracks:`);
  TRACKS.forEach(track => console.log(`   - ${track.name} (${track.id})`));
  console.log('');

  const monitors = TRACKS.map(track => new TrackMonitor(track));
  
  monitors.forEach(monitor => monitor.start());

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down worker...');
    monitors.forEach(monitor => monitor.stop());
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  return monitors;
}

// Standalone execution
async function main() {
  console.log('🚀 GoKart Monitor Worker Starting...');
  console.log(`📅 ${new Date().toLocaleString('hu-HU')}`);
  
  await startWorker();
  
  console.log('Press Ctrl+C to stop...');
}

// Only run main if executed directly
if (require.main === module) {
  const prisma = new PrismaClient();
  
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
  
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
