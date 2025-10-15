
export interface MarketStatus {
  isMarketOpen: boolean;
  isAfterMarketClose: boolean;
  marketStatus: string;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); 
  

  const dayOfWeek = koreaTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { 
    return false;
  }
  

  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60; 
  const marketCloseMinutes = 15 * 60 + 30; 
  
  return currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes;
}

export function isAfterMarketClose(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); 
  

  const dayOfWeek = koreaTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  

  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketCloseMinutes = 15 * 60 + 30; 
  
  return currentMinutes >= marketCloseMinutes;
}

export function isBeforeMarketOpen(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); 
  

  const dayOfWeek = koreaTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  

  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60; 
  
  return currentMinutes < marketOpenMinutes;
}

export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const isOpen = isMarketOpen();
  const isAfterClose = isAfterMarketClose();
  const isBeforeOpen = isBeforeMarketOpen();
  
  let marketStatus = '';
  let nextOpenTime: Date | undefined;
  let nextCloseTime: Date | undefined;
  
  if (isOpen) {
    marketStatus = '장중';

    const todayClose = new Date(koreaTime);
    todayClose.setHours(15, 30, 0, 0);
    nextCloseTime = todayClose;
  } else if (isAfterClose) {
    marketStatus = '장종료';

    const tomorrow = new Date(koreaTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    

    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    
    nextOpenTime = tomorrow;
  } else if (isBeforeOpen) {
    marketStatus = '장시작전';

    const todayOpen = new Date(koreaTime);
    todayOpen.setHours(9, 0, 0, 0);
    nextOpenTime = todayOpen;
  }
  
  return {
    isMarketOpen: isOpen,
    isAfterMarketClose: isAfterClose,
    marketStatus,
    nextOpenTime,
    nextCloseTime,
  };
}

export function getMinutesToNextMarketOpen(): number {
  const status = getMarketStatus();
  if (status.nextOpenTime) {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const diffMs = status.nextOpenTime.getTime() - koreaTime.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }
  return 0;
}

export function getMinutesToMarketClose(): number {
  const status = getMarketStatus();
  if (status.nextCloseTime) {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const diffMs = status.nextCloseTime.getTime() - koreaTime.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }
  return 0;
}

export function getTickSizeKRX(price: number): number {
  if (!isFinite(price) || price <= 0) return 1;
  if (price < 1000) return 1;
  if (price < 5000) return 5;
  if (price < 10000) return 10;
  if (price < 50000) return 50;
  if (price < 100000) return 100;
  if (price < 500000) return 500;
  if (price < 1000000) return 1000;
  return 2000;
}

export function stepByTick(price: number, steps: number): number {
  const tick = getTickSizeKRX(price);
  const next = price + steps * tick;
  const aligned = Math.max(Math.round(next / tick) * tick, 0);
  return aligned;
}