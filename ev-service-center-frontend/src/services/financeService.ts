import { httpClient } from "@/lib/httpClient";

// Updated interfaces for invoice and payment management
export interface Invoice {
    id: number;
    customerId: number;
    amount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    dueDate: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    payments?: Payment[];
}

export interface Payment {
    id: number;
    invoiceId: number;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer';
    paymentDate: string;
    reference: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    paidAt?: string;
    transactionId?: string;
    createdAt: string;
    updatedAt: string;
    
    // Relations
    invoice?: Invoice;
}

export interface CreateInvoiceRequest {
    customerId: number;
    amount: number;
    dueDate: string;
    description: string;
    appointmentId?: number;
}

export interface RecordPaymentRequest {
    invoiceId: number;
    amount: number;
    paymentMethod: 'cash' | 'bank_transfer';
    reference: string;
}

// API Functions
export const getInvoices = async (): Promise<Invoice[]> => {
    const res = await httpClient.get('/api/invoice');
    return res.data;
};

export const getInvoiceByAppointmentId = async (appointmentId: number): Promise<Invoice | null> => {
    try {
        const res = await httpClient.get(`/api/invoice/appointment/${appointmentId}`);
        return res.data;
    } catch (error) {
        return null;
    }
};

export const createInvoice = async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const res = await httpClient.post('/api/invoice', data);
    return res.data;
};

export const recordPayment = async (data: RecordPaymentRequest): Promise<Payment> => {
    const res = await httpClient.post('/api/invoice/payment', data);
    return res.data;
};

export const createInvoiceWithPayment = async (invoiceData: CreateInvoiceRequest, paymentData: Omit<RecordPaymentRequest, 'invoiceId'>): Promise<{ invoice: Invoice; payment: Payment }> => {
    const res = await httpClient.post('/api/invoice/create-with-payment', {
        invoice: invoiceData,
        payment: paymentData
    });
    return res.data;
};
