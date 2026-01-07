/**
 * Content History Manager
 *
 * Prevents semantic content repetition by maintaining a persistent history
 * of generated content core subjects using localStorage
 */

export interface ContentRecord {
  id: number;
  timestamp: string;
  coreSubject: string;
  category: string;
  visualPrompt?: string;
  metadata?: {
    title: string;
    hook: string;
  };
}

const STORAGE_KEY = 'puzzle_maker_content_history';
const MAX_HISTORY_SIZE = 500; // Keep last 500 videos

/**
 * Load content history from localStorage
 */
export const loadContentHistory = (): ContentRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ContentRecord[];
      console.log(`📚 Loaded ${parsed.length} content records from history`);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load content history:', error);
  }

  return [];
};

/**
 * Save content history to localStorage
 */
export const saveContentHistory = (history: ContentRecord[]): void => {
  try {
    // Keep only the most recent records
    const trimmedHistory = history.slice(-MAX_HISTORY_SIZE);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    console.log(`💾 Saved ${trimmedHistory.length} content records to history`);
  } catch (error) {
    console.error('Failed to save content history:', error);
  }
};

/**
 * Add a new content record to history
 */
export const addContentRecord = (
  coreSubject: string,
  category: string,
  visualPrompt?: string,
  metadata?: { title: string; hook: string }
): void => {
  console.log(`📝 [ContentHistory] Starting to add new record...`);
  console.log(`   Core Subject: "${coreSubject}"`);
  console.log(`   Category: "${category}"`);

  const history = loadContentHistory();
  console.log(`   Current history size: ${history.length}`);

  const newRecord: ContentRecord = {
    id: history.length > 0 ? Math.max(...history.map(r => r.id)) + 1 : 1,
    timestamp: new Date().toISOString(),
    coreSubject,
    category,
    visualPrompt,
    metadata
  };

  console.log(`   New record ID: ${newRecord.id}`);

  history.push(newRecord);
  saveContentHistory(history);

  console.log(`✅ [ContentHistory] Added content record #${newRecord.id}: "${coreSubject.substring(0, 50)}..."`);
  console.log(`   Total records now: ${history.length}`);
};

/**
 * Get list of all core subjects from history
 */
export const getAllCoreSubjects = (): string[] => {
  const history = loadContentHistory();
  return history.map(record => record.coreSubject);
};

/**
 * Get recent content records (last N records)
 */
export const getRecentRecords = (count: number = 50): ContentRecord[] => {
  const history = loadContentHistory();
  return history.slice(-count);
};

/**
 * Export content history as downloadable JSON file
 */
export const exportHistoryAsJSON = (): void => {
  const history = loadContentHistory();
  const dataStr = JSON.stringify(history, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `content_history_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`📥 Exported ${history.length} records to JSON file`);
};

/**
 * Import content history from JSON file
 */
export const importHistoryFromJSON = (jsonString: string): boolean => {
  try {
    const imported = JSON.parse(jsonString) as ContentRecord[];

    // Validate structure
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: must be an array');
    }

    // Merge with existing history (avoid duplicates by ID)
    const existing = loadContentHistory();
    const existingIds = new Set(existing.map(r => r.id));

    const newRecords = imported.filter(r => !existingIds.has(r.id));
    const merged = [...existing, ...newRecords].sort((a, b) => a.id - b.id);

    saveContentHistory(merged);
    console.log(`📤 Imported ${newRecords.length} new records (${imported.length - newRecords.length} duplicates skipped)`);

    return true;
  } catch (error) {
    console.error('Failed to import content history:', error);
    return false;
  }
};

/**
 * Export content history as readable text report
 */
export const exportHistoryReport = (): string => {
  const history = loadContentHistory();

  let report = `Content History Report\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Total Records: ${history.length}\n`;
  report += `\n${'='.repeat(80)}\n\n`;

  history.forEach(record => {
    report += `#${record.id} - ${new Date(record.timestamp).toLocaleString()}\n`;
    report += `Category: ${record.category}\n`;
    report += `Subject: ${record.coreSubject}\n`;
    if (record.metadata?.title) {
      report += `Title: ${record.metadata.title}\n`;
    }
    report += `\n${'-'.repeat(80)}\n\n`;
  });

  return report;
};

/**
 * Clear all content history (use with caution)
 */
export const clearContentHistory = (): void => {
  saveContentHistory([]);
  console.log('🗑️ Content history cleared');
};
