import { CalendarClock } from 'lucide-react';

const HRInterviews = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Lịch phỏng vấn</h1>
        <p className="text-sm text-gray-500 mt-0.5">Quản lý lịch phỏng vấn ứng viên tuyển dụng</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-20 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-navy-50 flex items-center justify-center mb-4">
          <CalendarClock size={28} className="text-navy-700" />
        </div>
        <h2 className="text-[16px] font-semibold text-gray-900 mb-2">Tính năng đang được phát triển</h2>
        <p className="text-[13px] text-gray-500 max-w-sm">
          Trang lịch phỏng vấn sẽ cho phép bạn lên lịch, quản lý và theo dõi
          các buổi phỏng vấn với ứng viên tuyển dụng.
        </p>
      </div>
    </div>
  );
};

export default HRInterviews;
