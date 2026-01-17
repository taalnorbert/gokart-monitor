import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/kart-stats', async (req, res) => {
  try {
    const trackId = req.query.trackId as string || 'default';
    const stats = await prisma.kartBestLap.findMany({
      where: { trackId },
      orderBy: { bestLapTime: 'asc' }
    });
    res.json(stats);
  } catch (error) {
    console.error('Error fetching kart stats:', error);
    res.status(500).json({ error: 'Failed to fetch kart stats' });
  }
});

app.post('/api/lap-time', async (req, res) => {
  try {
    const { kartNumber, kartClass, timeMs, timeDisplay, driverName, trackId = 'default' } = req.body;

    if (!kartNumber || !timeMs || !timeDisplay || !driverName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let kart = await prisma.kart.findUnique({ 
      where: { 
        kartNumber_trackId: { kartNumber, trackId }
      } 
    });
    if (!kart) {
      kart = await prisma.kart.create({
        data: { kartNumber, kartClass: kartClass || null, trackId }
      });
    }

    let driver = await prisma.driver.findUnique({ 
      where: { 
        name_trackId: { name: driverName, trackId }
      } 
    });
    if (!driver) {
      driver = await prisma.driver.create({
        data: { name: driverName, trackId }
      });
    }

    await prisma.lapTime.create({
      data: {
        timeMs,
        timeDisplay,
        trackId,
        kartId: kart.id,
        driverId: driver.id
      }
    });

    const existingBest = await prisma.kartBestLap.findUnique({
      where: { 
        kartNumber_trackId: { kartNumber, trackId }
      }
    });

    if (!existingBest) {
      await prisma.kartBestLap.create({
        data: {
          kartNumber,
          kartClass: kartClass || null,
          trackId,
          bestLapTime: timeMs,
          bestLapDisplay: timeDisplay,
          bestLapDriver: driverName,
          lapCount: 1
        }
      });
    } else {
      const updateData: any = {
        lapCount: existingBest.lapCount + 1
      };

      if (timeMs < existingBest.bestLapTime) {
        updateData.bestLapTime = timeMs;
        updateData.bestLapDisplay = timeDisplay;
        updateData.bestLapDriver = driverName;
      }

      if (kartClass) {
        updateData.kartClass = kartClass;
      }

      await prisma.kartBestLap.update({
        where: { 
          kartNumber_trackId: { kartNumber, trackId }
        },
        data: updateData
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving lap time:', error);
    res.status(500).json({ error: 'Failed to save lap time' });
  }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const trackId = req.query.trackId as string || 'default';
    const drivers = await prisma.driver.findMany({
      where: { trackId },
      orderBy: { name: 'asc' },
      include: {
        lapTimes: {
          orderBy: { timeMs: 'asc' },
          take: 1,
          include: { kart: true }
        }
      }
    });

    const driversWithStats = await Promise.all(drivers.map(async (driver) => {
      const totalLaps = await prisma.lapTime.count({
        where: { driverId: driver.id }
      });
      
      const bestLap = driver.lapTimes[0];
      
      return {
        name: driver.name,
        totalLaps,
        bestLapTime: bestLap?.timeMs || null,
        bestLapDisplay: bestLap?.timeDisplay || null,
        bestLapKart: bestLap?.kart?.kartNumber || null,
        createdAt: driver.createdAt
      };
    }));

    res.json(driversWithStats);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

app.get('/api/driver/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const trackId = req.query.trackId as string || 'default';
    
    const driver = await prisma.driver.findUnique({
      where: { 
        name_trackId: { name, trackId }
      },
      include: {
        lapTimes: {
          where: { trackId },
          include: { kart: true },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const bestLap = await prisma.lapTime.findFirst({
      where: { 
        driverId: driver.id,
        trackId
      },
      orderBy: { timeMs: 'asc' },
      include: { kart: true }
    });

    res.json({
      driver,
      bestLap,
      totalLaps: driver.lapTimes.length
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

app.get('/api/kart/:kartNumber', async (req, res) => {
  try {
    const { kartNumber } = req.params;
    const trackId = req.query.trackId as string || 'default';
    
    const kart = await prisma.kart.findUnique({
      where: { 
        kartNumber_trackId: { kartNumber, trackId }
      },
      include: {
        lapTimes: {
          where: { trackId },
          include: { driver: true },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!kart) {
      return res.status(404).json({ error: 'Kart not found' });
    }

    const bestLap = await prisma.lapTime.findFirst({
      where: { 
        kartId: kart.id,
        trackId
      },
      orderBy: { timeMs: 'asc' },
      include: { driver: true }
    });

    const kartBestInfo = await prisma.kartBestLap.findUnique({
      where: { 
        kartNumber_trackId: { kartNumber, trackId }
      }
    });

    // Get unique drivers who drove this kart
    const uniqueDrivers = [...new Set(kart.lapTimes.map(lt => lt.driver.name))];

    res.json({
      kart,
      bestLap,
      kartBestInfo,
      totalLaps: kart.lapTimes.length,
      uniqueDrivers
    });
  } catch (error) {
    console.error('Error fetching kart:', error);
    res.status(500).json({ error: 'Failed to fetch kart' });
  }
});

app.delete('/api/cleanup', async (req, res) => {
  try {
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const deletedLapTimes = await prisma.lapTime.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    const deletedDrivers = await prisma.driver.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    const deletedKarts = await prisma.kart.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    const deletedKartStats = await prisma.kartBestLap.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });

    res.json({ 
      success: true,
      deletedCounts: {
        lapTimes: deletedLapTimes.count,
        drivers: deletedDrivers.count,
        karts: deletedKarts.count,
        kartStats: deletedKartStats.count,
        total: deletedLapTimes.count + deletedDrivers.count + deletedKarts.count + deletedKartStats.count
      },
      cutoffDate 
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

app.delete('/api/reset', async (req, res) => {
  try {
    await prisma.lapTime.deleteMany();
    await prisma.kartBestLap.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.kart.deleteMany();

    res.json({ success: true, message: 'All data reset' });
  } catch (error) {
    console.error('Error during reset:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

const runCleanup = async () => {
  const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  try {
    // Töröljük a 48 óránál régebbi köridőket
    const deletedLapTimes = await prisma.lapTime.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    // Töröljük a 48 óránál régebbi vezetőket
    const deletedDrivers = await prisma.driver.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    // Töröljük a 48 óránál régebbi kartokat
    const deletedKarts = await prisma.kart.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    // Töröljük a 48 óránál régebbi kart statisztikákat
    const deletedKartStats = await prisma.kartBestLap.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });
    
    const totalDeleted = deletedLapTimes.count + deletedDrivers.count + deletedKarts.count + deletedKartStats.count;
    
    if (totalDeleted > 0) {
      console.log(`Cleanup: Deleted ${totalDeleted} records older than 48 hours`);
      console.log(`  - Lap times: ${deletedLapTimes.count}`);
      console.log(`  - Drivers: ${deletedDrivers.count}`);
      console.log(`  - Karts: ${deletedKarts.count}`);
      console.log(`  - Kart stats: ${deletedKartStats.count}`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

setInterval(runCleanup, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  runCleanup();
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
