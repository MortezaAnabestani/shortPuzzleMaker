/**
 * Content History Management Panel
 *
 * Allows users to view, export, and import content generation history
 */

import React, { useState } from "react";
import { Download, Upload, Trash2, Database, FileJson } from "lucide-react";
import {
  loadContentHistory,
  exportHistoryAsJSON,
  importHistoryFromJSON,
  clearContentHistory,
  getRecentRecords,
} from "../../utils/contentHistory";

const ContentHistoryPanel: React.FC = () => {
  const [historyCount, setHistoryCount] = useState(() => loadContentHistory().length);
  const [showRecent, setShowRecent] = useState(false);

  const handleExport = () => {
    exportHistoryAsJSON();
    alert(`✅ تاریخچه ${historyCount} محتوا با موفقیت دانلود شد!`);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const jsonString = event.target?.result as string;
          const success = importHistoryFromJSON(jsonString);
          if (success) {
            const newCount = loadContentHistory().length;
            setHistoryCount(newCount);
            alert(`✅ تاریخچه با موفقیت وارد شد! مجموع: ${newCount}`);
          } else {
            alert("❌ خطا در وارد کردن فایل JSON");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (
      confirm(`⚠️ آیا مطمئن هستید که می‌خواهید ${historyCount} رکورد را پاک کنید؟\nاین عمل قابل بازگشت نیست!`)
    ) {
      clearContentHistory();
      setHistoryCount(0);
      alert("✅ تاریخچه پاک شد");
    }
  };

  const handleRefresh = () => {
    const newCount = loadContentHistory().length;
    setHistoryCount(newCount);
  };

  const recentRecords = showRecent ? getRecentRecords(10) : [];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">تاریخچه محتوا</h3>
        </div>
        <div className="bg-blue-500/20 px-2 py-0.5 rounded text-xs text-blue-300">{historyCount} رکورد</div>
      </div>

      <div className="space-y-2">
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={historyCount === 0}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20
                     border border-emerald-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300">دانلود JSON</span>
          </div>
          <FileJson className="w-3 h-3 text-emerald-400/50 group-hover:text-emerald-400" />
        </button>

        {/* Import Button */}
        <button
          onClick={handleImport}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20
                     border border-blue-500/30 rounded-lg transition-all group"
        >
          <div className="flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-300">وارد کردن JSON</span>
          </div>
          <FileJson className="w-3 h-3 text-blue-400/50 group-hover:text-blue-400" />
        </button>

        {/* Recent Records Toggle */}
        <button
          onClick={() => setShowRecent(!showRecent)}
          disabled={historyCount === 0}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20
                     border border-purple-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-xs text-purple-300">{showRecent ? "پنهان کردن" : "نمایش"} 10 آخرین</span>
          <span className="text-xs text-purple-400/70">{showRecent ? "▼" : "▶"}</span>
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={historyCount === 0}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20
                     border border-red-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-300">پاک کردن همه</span>
          </div>
        </button>
      </div>

      {/* Recent Records List */}
      {showRecent && recentRecords.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">آخرین رکوردها:</div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {recentRecords.map((record) => (
              <div key={record.id} className="bg-white/5 rounded p-2 border border-white/10">
                <div className="text-[10px] text-blue-400 mb-1">
                  #{record.id} - {record.category}
                </div>
                <div className="text-xs text-gray-300 leading-tight line-clamp-2">{record.coreSubject}</div>
                <div className="text-[9px] text-gray-500 mt-1">
                  {new Date(record.timestamp).toLocaleString("fa-IR")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        className="w-full mt-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
      >
        🔄 بروزرسانی تعداد
      </button>
    </div>
  );
};

export default ContentHistoryPanel;
