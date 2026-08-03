import React, { useState } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { 
  useListAttendance, 
  useCreateAttendance,
  useListClasses,
  useListUsers,
  getListAttendanceQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AttendanceInputStatus } from '@workspace/api-client-react';
import { useAuthStore } from '@/store/use-auth';

export default function Attendance() {
  const { t } = useTranslation();
  const { role, userId } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState<number | undefined>();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const { data: classes } = useListClasses();
  const { data: students } = useListUsers({ role: 'student', classId: selectedClass });
  
  const { data: attendanceData, isLoading } = useListAttendance({ 
    classId: selectedClass, 
    date,
    studentId: role === 'student' ? userId! : undefined
  });

  const createAttendance = useCreateAttendance();

  const isTeacherView = role === 'teacher' || role === 'director' || role === 'zavuch';

  const markAttendance = (studentId: number, status: AttendanceInputStatus) => {
    if (!selectedClass) return;
    createAttendance.mutate({
      data: {
        studentId,
        classId: selectedClass,
        date,
        status
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
      }
    });
  };

  const statusColors = {
    present: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    absent: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    late: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    excused: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('attendance')}</h1>
        
        <div className="flex gap-2">
          {isTeacherView && (
            <select 
              className="bg-white/10 border-white/20 border rounded-xl px-3 py-2 outline-none text-sm"
              value={selectedClass || ''}
              onChange={e => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="" className="text-black">{t('no_data')} (Class)</option>
              {classes?.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
            </select>
          )}
          <input 
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-white/10 border-white/20 border rounded-xl px-3 py-2 outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isTeacherView ? (
          students?.map(student => {
            const record = attendanceData?.find(a => a.studentId === student.id);
            return (
              <GlassCard key={student.id} className="p-4 flex flex-col gap-4">
                <div className="font-medium">{student.firstName} {student.lastName}</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  {(['present', 'absent', 'late', 'excused'] as AttendanceInputStatus[]).map(status => {
                    const isSelected = record?.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => markAttendance(student.id, status)}
                        className={`py-2 rounded-lg border transition-all ${
                          isSelected ? statusColors[status] : 'border-white/10 bg-white/5 hover:bg-white/10 text-foreground/70'
                        }`}
                      >
                        {t(status as any)}
                      </button>
                    )
                  })}
                </div>
              </GlassCard>
            );
          })
        ) : (
          attendanceData?.map(record => (
            <GlassCard key={record.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
                {record.note && <div className="text-xs text-foreground/60 mt-1">{record.note}</div>}
              </div>
              <div className={`px-3 py-1 rounded-lg border text-sm font-medium ${statusColors[record.status]}`}>
                {t(record.status as any)}
              </div>
            </GlassCard>
          ))
        )}
        {(!students?.length && isTeacherView) || (!attendanceData?.length && !isTeacherView) ? (
          <div className="col-span-full p-8 text-center text-foreground/50">{t('no_data')}</div>
        ) : null}
      </div>
    </div>
  );
}
