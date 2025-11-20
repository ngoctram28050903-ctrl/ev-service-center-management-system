import Joi from 'joi';

export const recordPaymentSchema = Joi.object({
  invoiceId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(), // Bắt buộc là số dương
  paymentMethod: Joi.string().valid('cash', 'bank_transfer').required(), // Chỉ 1 trong 2
  transactionId: Joi.string().allow(null, ''), // Cho phép null hoặc rỗng
  note: Joi.string().allow(null, ''),
  paidAt: Joi.date().optional() // Không bắt buộc
});

export const createInvoiceSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().required(),
  description: Joi.string().allow(null, ''),
  appointmentId: Joi.number().integer().positive().allow(null)
});

export const createInvoiceWithPaymentSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().required(),
  description: Joi.string().allow(null, ''),
  appointmentId: Joi.number().integer().positive().allow(null),
  
  paymentMethod: Joi.string().valid('cash', 'bank_transfer').required(),
  transactionId: Joi.string().allow(null, ''),
  note: Joi.string().allow(null, '')
});