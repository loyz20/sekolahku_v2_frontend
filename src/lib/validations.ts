import { z } from 'zod';

// Login form validation
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Student form validation
export const studentSchema = z.object({
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  nis: z
    .string()
    .min(1, 'NIS wajib diisi')
    .regex(/^\d+$/, 'NIS harus berupa angka'),
  nisn: z
    .string()
    .min(1, 'NISN wajib diisi')
    .regex(/^\d{10}$/, 'NISN harus 10 angka'),
  jenis_kelamin: z
    .enum(['L', 'P'], {
      message: 'Pilih jenis kelamin'
    }),
  tanggal_lahir: z
    .string()
    .min(1, 'Tanggal lahir wajib diisi')
    .refine(
      (date) => {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d.getTime());
      },
      'Tanggal lahir tidak valid'
    ),
  tempat_lahir: z
    .string()
    .min(1, 'Tempat lahir wajib diisi')
    .max(100, 'Tempat lahir maksimal 100 karakter'),
});

export type StudentFormData = z.infer<typeof studentSchema>;

// User/PTK form validation
export const userSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  nama_asli: z
    .string()
    .min(1, 'Nama asli wajib diisi')
    .min(3, 'Nama asli minimal 3 karakter')
    .max(100, 'Nama asli maksimal 100 karakter'),
  role: z
    .enum(['superadmin', 'admin', 'guru', 'karyawan'], {
      message: 'Pilih role yang valid'
    }),
});

export type UserFormData = z.infer<typeof userSchema>;

// Class/Rombel form validation
export const clasSchema = z.object({
  nama: z
    .string()
    .min(1, 'Nama kelas wajib diisi')
    .min(2, 'Nama kelas minimal 2 karakter')
    .max(50, 'Nama kelas maksimal 50 karakter'),
  tingkat: z
    .enum(['10', '11', '12'], {
      message: 'Pilih tingkat yang valid'
    }),
  semester_id: z
    .string()
    .min(1, 'Semester wajib dipilih'),
});

export type ClassFormData = z.infer<typeof clasSchema>;

// Subject/Mata Pelajaran validation
export const subjectSchema = z.object({
  nama: z
    .string()
    .min(1, 'Nama mata pelajaran wajib diisi')
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(20, 'Kode maksimal 20 karakter'),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

// Helper function to validate and return errors
export function validateForm<T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string[]> } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const field = String(issue.path[0] || 'general');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(issue.message);
      }
      return { success: false, errors };
    }
    return { success: false, errors: { general: ['Validation error'] } };
  }
}
