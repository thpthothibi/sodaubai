/* Lịch điều chỉnh tuần 13 năm học 2026–2027: T7 14/11 -> CN 15/11.
 * Chỉ thay lịch dự kiến; bản ghi thực tế luôn giữ ngày đã lưu.
 */
'use strict';
function sodbWeek13MovedV1(monday) {
  const d = new Date(monday);
  return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 9;
}
function sodbBookDaysV1(matrix, monday, holidayDates) {
  const days = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];
  const has = day => Object.keys(matrix || {}).some(key => key.startsWith(day + '_') && Object.keys(matrix[key] || {}).length);
  const offsets = sodbWeek13MovedV1(monday) && !has('Thứ 7') && !sodbIsHolidayV2(monday, 5, holidayDates) ? [0,1,2,3,4,6] : [0,1,2,3,4,5];
  if (!offsets.includes(6) && (has('Chủ Nhật') || sodbWeek13MovedV1(monday) || sodbIsHolidayV2(monday, 6, holidayDates))) offsets.push(6);
  return offsets.map(offset => ({name: days[offset], offset}));
}
function sodbIsHolidayV2(monday, offset, dates) {
  if (!Array.isArray(dates) || !dates.length) return false;
  const date = new Date(monday);
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return dates.includes(`${date.getFullYear()}-${month}-${day}`);
}
function sodbHolidayDayLabelV2(monday, offset, dates) {
  return sodbIsHolidayV2(monday, offset, dates) ? '<div class="fw-bold">Nghỉ lễ</div>' : '';
}
function sodbHolidayNoticeV1(dates) {
  if (!Array.isArray(dates) || !dates.length) return '';
  return 'Nghỉ lễ: ' + dates.map(date => String(date).split('-').reverse().join('/')).join(', ') + '.';
}
function sodbWeek13NoticeV1(monday) {
  return sodbWeek13MovedV1(monday) ? 'Tuần 13: lịch thứ Bảy 14/11/2026 chuyển sang Chủ nhật 15/11/2026 để dạy trực tuyến.' : '';
}
