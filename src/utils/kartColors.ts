export const getCellStyle = (cssClass: string): React.CSSProperties => {
  if (cssClass.includes('tb')) {
    return { color: '#E535AB', fontWeight: 'bold' };
  }
  if (cssClass.includes('ib')) {
    return { backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold' };
  }
  if (cssClass.includes('tn')) {
    return { color: '#00FF00' };
  }
  if (cssClass.includes('ti')) {
    return { color: '#FFFFFF' };
  }
  return {};
};

export const getStatusStyle = (statusClass: string): { color: string; label: string } => {
  if (statusClass.includes('sr')) {
    return { color: '#FFD700', label: '●' };
  }
  if (statusClass.includes('in')) {
    return { color: '#00FF88', label: '●' };
  }
  return { color: '#666', label: '○' };
};

export const getGroupStyle = (groupClass: string): string => {
  if (groupClass.includes('gs')) return '#FFD700';
  if (groupClass.includes('gf')) return '#C0C0C0';
  if (groupClass.includes('gm')) return '#CD7F32';
  if (groupClass.includes('gl')) return '#666666';
  return 'transparent';
};
