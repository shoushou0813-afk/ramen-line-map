// 初回に「サンプルを入れてみる」を押したときに入るデータ。
// 固定の日付にすると、いつ開いても過去の予定になって時間割が空に見えるので、
// 実行した日を基準に前後の日付を組み立てている。

import { addDays, startOfWeek, toDateKey } from "../lib/date.js";

export function sampleEvents(today = new Date()) {
  // 今週の月曜を基準にすると、どの曜日に開いても同じ見え方になる
  const monday = startOfWeek(today);
  const at = (offset) => toDateKey(addDays(monday, offset));

  return [
    {
      id: "sample-1",
      company: "サンプル商事",
      type: "briefing",
      date: at(1),
      start: "13:00",
      end: "14:30",
      place: "オンライン（Zoom）",
      memo: "事前アンケートあり",
      done: false,
    },
    {
      id: "sample-2",
      company: "サンプル銀行",
      type: "briefing",
      date: at(1),
      start: "14:00",
      end: "15:00",
      place: "本社ビル3F",
      memo: "サンプル商事と時間が重なっている",
      done: false,
    },
    {
      id: "sample-3",
      company: "サンプル商事",
      type: "es",
      date: at(4),
      start: "23:59",
      end: "",
      place: "マイページから提出",
      memo: "ガクチカ400字 / 志望動機300字",
      done: false,
    },
    {
      id: "sample-4",
      company: "サンプルメーカー",
      type: "webtest",
      date: at(9),
      start: "",
      end: "",
      place: "自宅受験",
      memo: "SPI。締切当日は混むので前日までに",
      done: false,
    },
    {
      id: "sample-5",
      company: "サンプル銀行",
      type: "interview",
      date: at(10),
      start: "10:00",
      end: "11:00",
      place: "本社ビル12F",
      memo: "一次面接。30分前に到着",
      done: false,
    },
    {
      id: "sample-6",
      company: "サンプルメーカー",
      type: "og",
      date: at(3),
      start: "18:30",
      end: "19:30",
      place: "駅前カフェ",
      memo: "先輩からの紹介",
      done: false,
    },
  ];
}
