"use client";

import { useState, useRef } from 'react';
import styles from '../app/(manager)/staff/staff.module.css';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ count?: number; error?: string; warnings?: string[]; errors?: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CSV_TEMPLATE_HEADERS = 'full_name,phone_number,primary_role,secondary_roles,english_proficiency,other_languages,special_skills,home_base_venue,employment_type,availability_status,notes';
    const CSV_TEMPLATE_EXAMPLES = [
        'John Doe,+971501234567,Waiter,Bartender,good,"French,Spanish","First Aid,VIP",SONARA,internal,available,Experienced server',
        'Jane Smith,+971509876543,Manager,,fluent,Arabic,Leadership,NEST,internal,available,Guest relations specialist',
        '# ROLES: Waiter, Runner, Supervisor, Manager, Bartender, Barback, Bar Supervisor, Sommelier, Host, Cashier, Busser, Head Waiter',
        '# VENUES: SONARA, NEST, LADY NARA',
        '# ENGLISH: basic, medium, good, fluent',
        '# EMPLOYMENT: internal, external, freelancer',
        '# STATUS: available, off, leave'
    ].join('\n');

    const downloadTemplate = () => {
        const content = CSV_TEMPLATE_HEADERS + '\n' + CSV_TEMPLATE_EXAMPLES;
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'staff_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/staff/import', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');

            setResult({
                count: data.count,
                warnings: data.warnings,
                errors: data.errors
            });

            if (data.count > 0) {
                onSuccess();
                // We don't close immediately if there are warnings/errors to show
                if (!data.errors?.length && !data.warnings?.length) {
                    setTimeout(onClose, 2000);
                }
            }

        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>Bulk Import Staff</h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Import multiple staff members at once using a CSV or Excel file (.xlsx, .xls).
                        Please ensure your file matches our template for a smooth import.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <button
                            onClick={downloadTemplate}
                            className={styles.buttonSecondary}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download Template (CSV)
                        </button>
                    </div>

                    <div
                        className={styles.formGroup}
                        style={{
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            padding: '2rem',
                            textAlign: 'center',
                            background: file ? '#f0fdf4' : '#f8fafc',
                            borderColor: file ? '#22c55e' : '#e2e8f0',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                        />
                        <div>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                {file ? '📄' : '📤'}
                            </div>
                            <div style={{ fontWeight: '600', color: file ? '#166534' : '#475569' }}>
                                {file ? file.name : 'Click to select CSV or Excel file'}
                            </div>
                            {!file && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Works with .csv, .xlsx, or .xls</div>}
                        </div>
                    </div>

                    {result && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div
                                style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: result.error ? '#fef2f2' : (result.count ? '#f0fdf4' : '#fff7ed'),
                                    color: result.error ? '#991b1b' : (result.count ? '#166534' : '#9a3412'),
                                    border: `1px solid ${result.error ? '#fee2e2' : (result.count ? '#dcfce7' : '#ffedd5')}`,
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    {result.error ? <span>⚠️ Error</span> : <span>✅ Success</span>}
                                </div>
                                {result.error ? result.error : `Successfully imported ${result.count} staff members.`}
                            </div>

                            {(result.errors?.length || 0) > 0 && (
                                <div style={{ margin: '1rem 0' }}>
                                    <h4 style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Errors ({result.errors?.length}):</h4>
                                    <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#fef2f2', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#b91c1c' }}>
                                        {result.errors?.map((err, i) => <div key={i}>{err}</div>)}
                                    </div>
                                </div>
                            )}

                            {(result.warnings?.length || 0) > 0 && (
                                <div style={{ margin: '1rem 0' }}>
                                    <h4 style={{ color: '#92400e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Warnings ({result.warnings?.length}):</h4>
                                    <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#fffbeb', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#b45309' }}>
                                        {result.warnings?.map((warn, i) => <div key={i}>{warn}</div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className={styles.buttonSecondary} onClick={onClose}>Close</button>
                    <button
                        onClick={handleUpload}
                        className={styles.buttonPrimary}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Importing...' : 'Upload & Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
