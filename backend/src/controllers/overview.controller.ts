import type { Request, Response } from 'express'
import { Category } from '../models/Category'
import { ContactMessage } from '../models/ContactMessage'
import { Enrollment } from '../models/Enrollment'
import { Offer } from '../models/Offer'
import { Report } from '../models/Report'
import { User } from '../models/User'

// Resumen del panel de administración: pendientes que requieren acción y cifras generales de la plataforma
export async function getAdminOverview(_req: Request, res: Response): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [students, tutors, pendingTutors, suspended, pendingAppeals, openReports, messagesWeek, messagesTotal, activeEnrollments, activeOffers, categories] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'tutor', 'tutorProfile.status': 'approved' }),
    User.countDocuments({ role: 'tutor', 'tutorProfile.status': 'pending' }),
    User.countDocuments({ suspended: true }),
    User.countDocuments({ suspended: true, 'suspension.appeal.status': 'pending' }),
    Report.countDocuments({ status: { $in: ['pending', 'reviewing'] } }),
    ContactMessage.countDocuments({ createdAt: { $gte: weekAgo } }),
    ContactMessage.countDocuments({}),
    Enrollment.countDocuments({ status: 'active' }),
    Offer.countDocuments({ active: true }),
    Category.countDocuments({ active: true }),
  ])

  res.json({ students, tutors, pendingTutors, suspended, pendingAppeals, openReports, messagesWeek, messagesTotal, activeEnrollments, activeOffers, categories })
}
