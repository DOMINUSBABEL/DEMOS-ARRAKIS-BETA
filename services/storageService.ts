
import { SavedAnalysis } from '../types';

const STORAGE_PREFIX = 'demos_cache_';

export const saveAnalysis = (username: string, type: SavedAnalysis['type'], name: string, data: any): void => {
    const key = `${STORAGE_PREFIX}${username.toUpperCase()}`;
    const existingDataStr = localStorage.getItem(key);
    let existingData: SavedAnalysis[] = existingDataStr ? JSON.parse(existingDataStr) : [];

    const newEntry: SavedAnalysis = {
        id: Date.now().toString(),
        name,
        type,
        date: new Date().toISOString(),
        data
    };

    existingData.unshift(newEntry); // Add to top
    localStorage.setItem(key, JSON.stringify(existingData));
};

export const getSavedAnalyses = (username: string, type?: SavedAnalysis['type']): SavedAnalysis[] => {
    const key = `${STORAGE_PREFIX}${username.toUpperCase()}`;
    const existingDataStr = localStorage.getItem(key);
    if (!existingDataStr) return [];

    const allData: SavedAnalysis[] = JSON.parse(existingDataStr);
    if (type) {
        return allData.filter(item => item.type === type);
    }
    return allData;
};

export const deleteAnalysis = (username: string, id: string): void => {
    const key = `${STORAGE_PREFIX}${username.toUpperCase()}`;
    const existingDataStr = localStorage.getItem(key);
    if (!existingDataStr) return;

    let existingData: SavedAnalysis[] = JSON.parse(existingDataStr);
    existingData = existingData.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(existingData));
};
