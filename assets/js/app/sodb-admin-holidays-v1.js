(function () {
  'use strict';

  function init() {
    const el = id => document.getElementById(id);
    const tab = el('pills-holidays-tab');
    if (!tab) return;

    const week = el('adminHolidayWeekV1');
    const days = el('adminHolidayDaysV1');
    const reload = el('adminHolidayReloadV1');
    const save = el('adminHolidaySaveV1');
    const status = el('adminHolidayStatusV1');
    const year = el('adminHolidayYearV1');
    let loaded = null;
    let busy = false;

    const getToken = () => String(adminDangNhapInfo?.sessionToken || '');
    const selected = () => Array.from(days.querySelectorAll('input:checked'), input => input.value);
    const original = () => loaded.days.filter(day => day.holiday).map(day => day.date);
    const changed = () => loaded && JSON.stringify(selected()) !== JSON.stringify(original());
    function updateControls() {
      week.disabled = busy;
      reload.disabled = busy;
      days.disabled = busy || !loaded;
      save.disabled = busy || !changed();
    }

    function render(data) {
      for (const {date, day, holiday} of data.days) {
        const label = document.createElement('label');
        label.className = 'border rounded p-2 d-flex gap-2 align-items-center';
        const input = document.createElement('input');
        input.className = 'form-check-input m-0';
        input.type = 'checkbox';
        input.value = date;
        input.checked = holiday;
        label.append(input, day + ' · ' + date.split('-').reverse().join('/'));
        days.append(label);
      }
    }

    async function request(write = false) {
      if (busy || (write && !changed())) return;
      const token = getToken();
      if (!token) {
        status.textContent = 'Cần đăng nhập bằng tài khoản quản trị.';
        return;
      }
      const weekNumber = Number(week.value) || null;
      const args = write
        ? [{schoolYear: loaded.schoolYear, week1: loaded.week1, week: loaded.week, dates: selected(), previousDates: original()}, {token}]
        : [weekNumber, {token}];
      busy = true;
      status.className = 'small text-muted my-2';
      status.textContent = write ? 'Đang lưu lịch nghỉ lễ…' : 'Đang tải lịch nghỉ lễ…';
      if (!write) {
        loaded = null;
        days.replaceChildren();
      }
      updateControls();
      try {
        const data = await callSodbEdgeRpcV67(write ? 'luuLichNghiLeV1' : 'layLichNghiLeV1', args);
        if (!data?.success || !Array.isArray(data.days)) {
          if (data?.conflict) loaded = null;
          throw new Error(data?.message || 'Máy chủ chưa hỗ trợ lịch nghỉ lễ.');
        }
        if (getToken() !== token) {
          loaded = null;
          days.replaceChildren();
          status.textContent = 'Phiên đăng nhập đã thay đổi. Hãy tải lại.';
          return;
        }
        loaded = data;
        year.textContent = 'Năm học ' + data.schoolYear;
        week.value = String(data.week);
        days.replaceChildren();
        render(data);
        status.textContent = write ? 'Đã lưu lịch nghỉ lễ. ' + (data.auditWarning || '') : '';
        if (write) {
          if (typeof sodbViewCacheV6 !== 'undefined') sodbViewCacheV6.clear();
          if (typeof invalidateBghWorkflowCacheV701 === 'function') invalidateBghWorkflowCacheV701();
        }
      } catch (err) {
        status.className = 'small text-danger my-2';
        status.textContent = err?.message || String(err);
      } finally {
        busy = false;
        updateControls();
      }
    }

    week.add(new Option('Tuần hiện tại', ''));
    for (let n = 1; n <= 53; n++) week.add(new Option('Tuần ' + n, String(n)));
    week.addEventListener('change', () => request());
    reload.addEventListener('click', () => request());
    save.addEventListener('click', () => request(true));
    days.addEventListener('change', () => {
      status.className = 'small text-muted my-2';
      status.textContent = changed() ? 'Bấm Lưu lịch nghỉ lễ để áp dụng.' : '';
      updateControls();
    });
    tab.addEventListener('shown.bs.tab', () => request());
    updateControls();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
