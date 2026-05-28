'use client';

import { useMemo } from 'react';
import type { CourseRecord } from '../types';
import { useCourseCart } from './requirements/CourseCartContext';

const PERIODS = [
  { id: 'D0', label: '特早', time: '07:10-08:00' },
  { id: 'D1', label: '第一', time: '08:10-09:00' },
  { id: 'D2', label: '第二', time: '09:10-10:00' },
  { id: 'D3', label: '第三', time: '10:10-11:00' },
  { id: 'D4', label: '第四', time: '11:10-12:00' },
  { id: 'DN', label: '特午', time: '12:40-13:30' },
  { id: 'D5', label: '第五', time: '13:40-14:30' },
  { id: 'D6', label: '第六', time: '14:40-15:30' },
  { id: 'D7', label: '第七', time: '15:40-16:30' },
  { id: 'D8', label: '第八', time: '16:40-17:30' },
  { id: 'E0', label: '第九', time: '17:40-18:30' },
  { id: 'E1', label: '夜一', time: '18:40-19:30' },
  { id: 'E2', label: '夜二', time: '19:35-20:20' },
  { id: 'E3', label: '夜三', time: '20:30-21:20' },
  { id: 'E4', label: '夜四', time: '21:25-22:10' },
];

const DAYS = ['週一', '週二', '週三', '週四', '週五', '週六'];

const ROOM_MAP: Record<string, string> = {
  'CG': '文學院', 'IG': '傳播學院', 'KG': '教育學院', 'LI': '文華樓',
  'LF': '文友樓', 'LE': '文開樓', 'LP': '積健樓', 'LG': '文學院研究所教室',
  'AG': '藝術學院', 'AA': '應用美術學系教室', 'AL': '景觀設計學系教室',
  'AM': '音樂學系教室', 'DG': '醫學院/倬章樓', 'MD': '國璽樓',
  'SG': '理工學院', 'LS': '生命科學系', 'CH': '化學系', 'LH': '理工學院綜合教室',
  'MA': '數學系', 'PH': '物理學系', 'SF': '聖言樓', 'CF': '舒德樓',
  'HG': '民生學院', 'EP': '食品工廠', 'FC': '輔幼教室', 'HE': '兒家、餐旅學系',
  'NF': '食科、營養學系', 'CO': '織品學院', 'TC': '織品系(朝橒樓)',
  'FG': '外語學院/德芳外語大樓', 'LA': '外語A樓', 'LB': '外語B樓', 'LC': '外語C樓',
  'FL': '翻譯研究所教室', 'JG': '法律學院', 'WG': '社會科學院', 'MG': '管理學院',
  'LW': '樹德樓', 'BS': '伯達樓', 'LM': '利瑪竇樓', 'JS': '濟時樓',
  'SS': '法園', 'NM': '進修部', 'ES': '進修部教學大樓'
};

interface ParsedSlot {
  name: string;
  room: string;
  fullRoomName: string;
  type: 'enrolled' | 'cart';
  dayIndex: number; // 0 for Mon, 1 for Tue, etc.
  startPeriodIndex: number; // 0 for D0, 1 for D1, etc.
  periodSpan: number;
}

function parseTimeStr(timeStr: string): ParsedSlot[] {
  if (!timeStr || timeStr === '時間未定') return [];
  const parts = timeStr.split(' / ');
  const results: ParsedSlot[] = [];

  for (const part of parts) {
    const match = part.match(/^(週[一二三四五六日])\s+([D|E0-9\-]+)(?:\s*\(([^)]+)\))?/);
    if (!match) continue;

    const dayStr = match[1];
    const periodStr = match[2];
    const room = match[3] || '';

    const dayIndex = DAYS.indexOf(dayStr);
    if (dayIndex === -1) continue;

    if (periodStr.includes('-')) {
      const [start, end] = periodStr.split('-');
      const startIndex = PERIODS.findIndex(p => p.id === start);
      const endIndex = PERIODS.findIndex(p => p.id === end);
      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        results.push({
          name: '', room, fullRoomName: '', type: 'enrolled',
          dayIndex, startPeriodIndex: startIndex, periodSpan: endIndex - startIndex + 1
        });
      }
    } else {
      const pIndex = PERIODS.findIndex(p => p.id === periodStr);
      if (pIndex !== -1) {
        results.push({
          name: '', room, fullRoomName: '', type: 'enrolled',
          dayIndex, startPeriodIndex: pIndex, periodSpan: 1
        });
      }
    }
  }

  return results;
}

function getFullRoomName(roomCode: string) {
  if (!roomCode) return '';
  const prefix = roomCode.substring(0, 2).toUpperCase();
  const name = ROOM_MAP[prefix];
  return name ? `${name} (${roomCode})` : roomCode;
}

export default function Timetable({ records }: { records: CourseRecord[] }) {
  const { items: cartItems } = useCourseCart();

  const allBlocks = useMemo(() => {
    const blocks: ParsedSlot[] = [];
    
    // Process Enrolled
    records.filter(r => r.status === 'enrolled').forEach(record => {
      if (!record.time) return;
      const slots = parseTimeStr(record.time);
      slots.forEach(s => {
        blocks.push({
          ...s,
          name: record.course_name,
          fullRoomName: getFullRoomName(s.room),
          type: 'enrolled'
        });
      });
    });

    // Process Cart Items
    cartItems.forEach(item => {
      if (!item.time) return;
      const slots = parseTimeStr(item.time);
      slots.forEach(s => {
        blocks.push({
          ...s,
          name: item.name,
          fullRoomName: getFullRoomName(s.room),
          type: 'cart'
        });
      });
    });

    return blocks;
  }, [records, cartItems]);

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-black/10 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-black/5 bg-[#fcfcfc] flex items-center justify-between">
        <h3 className="font-bold text-lg text-black/90">我的課表</h3>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-[#0055b3]">
            <div className="w-3 h-3 rounded bg-[#00f]/15 border border-[#0075de]/30" />
            已選課程
          </div>
          <div className="flex items-center gap-1.5 text-[#dd5b00]">
            <div className="w-3 h-3 rounded border-2 border-dashed border-[#dd5b00]/40 bg-[#fff4ee]" />
            預排推薦
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px] relative">
          
          {/* Main Grid: 1 header row + 15 period rows. 7 columns (Time + 6 Days) */}
          {/* grid-rows-[40px_repeat(15,minmax(60px,auto))] allows height to stretch if content is too much */}
          <div 
            className="grid border-b border-black/5"
            style={{ 
              gridTemplateColumns: '80px repeat(6, minmax(0, 1fr))',
              gridTemplateRows: `40px repeat(${PERIODS.length}, minmax(60px, auto))`
            }}
          >
            {/* 1. Draw grid lines & background headers */}
            {/* Top-left empty corner */}
            <div className="border-r border-b border-black/5 bg-[#fcfcfc] row-start-1 col-start-1" />
            
            {/* Day Headers */}
            {DAYS.map((day, dIdx) => (
              <div 
                key={day} 
                className="px-2 py-2 text-center text-sm font-bold text-[#615d59] border-r border-b border-black/5 bg-[#fcfcfc] flex items-center justify-center"
                style={{ gridColumn: dIdx + 2, gridRow: 1 }}
              >
                {day}
              </div>
            ))}

            {/* Time Labels & Row Borders */}
            {PERIODS.map((period, pIdx) => (
              <div 
                key={period.id} 
                className="border-r border-b border-black/5 bg-[#fcfcfc] flex flex-col items-center justify-center p-1 group"
                style={{ gridColumn: 1, gridRow: pIdx + 2 }}
              >
                <span className="font-bold text-sm text-[#2d2a26]">{period.id}</span>
                <span className="text-[10px] text-[#8c8782] text-center leading-tight mt-0.5">{period.time.replace('-', '\n')}</span>
              </div>
            ))}

            {/* Empty grid cells for background lines */}
            {PERIODS.map((_, pIdx) => (
              DAYS.map((_, dIdx) => (
                <div 
                  key={`${pIdx}-${dIdx}`}
                  className="border-r border-b border-black/5 border-dashed pointer-events-none"
                  style={{ gridColumn: dIdx + 2, gridRow: pIdx + 2 }}
                />
              ))
            ))}

            {/* 2. Draw Course Blocks */}
            {allBlocks.map((block, idx) => (
              <div
                key={idx}
                className="p-0.5 relative group/slot pointer-events-auto"
                style={{ 
                  gridColumn: block.dayIndex + 2, 
                  gridRow: `${block.startPeriodIndex + 2} / span ${block.periodSpan}`
                }}
              >
                <div 
                  className={`w-full h-full p-2 rounded-lg flex flex-col justify-center items-center text-center transition-all cursor-help
                    ${block.type === 'enrolled' 
                      ? 'bg-[#f0f5ff]/95 border border-[#0075de]/30 text-[#0055b3] shadow-sm hover:bg-[#e0edff] hover:shadow-md hover:-translate-y-0.5' 
                      : 'bg-[#fff4ee]/95 border-2 border-dashed border-[#dd5b00]/40 text-[#dd5b00] shadow-sm hover:bg-[#ffece0] hover:-translate-y-0.5'
                    }
                  `}
                >
                  <span className="text-xs font-bold leading-tight line-clamp-3 mb-1">{block.name}</span>
                  {block.room && (
                    <span className="text-[10px] opacity-80" title={block.fullRoomName}>
                      {block.room}
                    </span>
                  )}
                  
                  {/* Tooltip */}
                  {block.room && (
                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[200px] px-2.5 py-1.5 bg-black/90 backdrop-blur text-white text-xs font-medium rounded-lg opacity-0 group-hover/slot:opacity-100 transition-opacity pointer-events-none shadow-lg">
                      {block.fullRoomName}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-black/90" />
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
