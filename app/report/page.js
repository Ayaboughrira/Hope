 'use client';

import ReportForm from '../component/ReportForm';
import styles from '../styles/reportForm.module.css';

export default function ReportPage() {
  return (
    <div className={styles.reportFormPage}>
      <ReportForm />
    </div>
  );
}