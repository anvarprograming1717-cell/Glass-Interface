import React, { useState } from 'react';
import { useTranslation } from '@/i18n/use-translation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { 
  useListGrades, 
  useCreateGrade,
  useListSubjects,
  useListClasses,
  useListUsers,
  getListGradesQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { GradeInputType } from '@workspace/api-client-react';
import { Search, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth';

export default function Grades() {
  const { t } = useTranslation();
  const { role, userId } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState<number | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  
  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();
  const { data: students } = useListUsers({ role: 'student', classId: selectedClass });
  
  const { data: grades, isLoading } = useListGrades({ 
    classId: selectedClass, 
    subjectId: selectedSubject,
    studentId: role === 'student' ? userId! : undefined
  });

  const createGrade = useCreateGrade();

  const handleQuickGrade = (studentId: number, value: number) => {
    if (!selectedClass || !selectedSubject || !userId) return;
    
    createGrade.mutate({
      data: {
        studentId,
        subjectId: selectedSubject,
        teacherId: userId,
        classId: selectedClass,
        value,
        type: GradeInputType.daily,
        date: new Date().toISOString().split('T')[0]
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() });
      }
    });
  };

  const isTeacherView = role === 'teacher' || role === 'director' || role === 'zavuch';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t('grades')}</h1>
        
        {isTeacherView && (
          <div className="flex gap-2">
            <select 
              className="bg-white/10 border-white/20 border rounded-xl px-3 py-2 outline-none text-sm"
              value={selectedClass || ''}
              onChange={e => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="" className="text-black">{t('no_data')} (Class)</option>
              {classes?.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
            </select>
            
            <select 
              className="bg-white/10 border-white/20 border rounded-xl px-3 py-2 outline-none text-sm"
              value={selectedSubject || ''}
              onChange={e => setSelectedSubject(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="" className="text-black">{t('no_data')} (Subject)</option>
              {subjects?.map(s => <option key={s.id} value={s.id} className="text-black">{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {isTeacherView && selectedClass && selectedSubject ? (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium">{t('students')}</th>
                <th className="p-4 font-medium text-center">Quick Grade</th>
                <th className="p-4 font-medium text-right">Recent</th>
              </tr>
            </thead>
            <tbody>
              {students?.map(student => {
                const studentGrades = grades?.filter(g => g.studentId === student.id) || [];
                return (
                  <tr key={student.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4 font-medium">{student.firstName} {student.lastName}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            onClick={() => handleQuickGrade(student.id, v)}
                            className={`w-8 h-8 rounded-lg font-medium transition-all ${
                              v >= 4 ? 'hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              v === 3 ? 'hover:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                              'hover:bg-red-500/20 text-red-600 dark:text-red-400'
                            } bg-white/5 border border-white/10 hover:border-transparent`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {studentGrades.slice(0, 3).map(g => (
                          <span key={g.id} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs opacity-70">
                            {g.value}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students?.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-foreground/50">{t('no_data')}</td></tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">{t('loading')}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium text-right">Grade</th>
                </tr>
              </thead>
              <tbody>
                {grades?.map(grade => (
                  <tr key={grade.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4 opacity-70">{new Date(grade.date).toLocaleDateString()}</td>
                    <td className="p-4">{grade.subjectName}</td>
                    <td className="p-4 opacity-70 capitalize">{grade.type}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center font-bold ${
                        grade.value >= 4 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                        grade.value === 3 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                        'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {grade.value}
                      </span>
                    </td>
                  </tr>
                ))}
                {!grades?.length && (
                  <tr><td colSpan={4} className="p-8 text-center text-foreground/50">{t('no_data')}</td></tr>
                )}
              </tbody>
            </table>
          )}
        </GlassCard>
      )}
    </div>
  );
}
