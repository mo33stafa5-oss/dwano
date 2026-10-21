import './style.css';import type {Metadata} from 'next';
export const metadata:Metadata={title:'Dwano | دوانو — دواءك أقرب مما تتخيل',description:'منصة تجريبية للبحث عن توافر الأدوية في الصيدليات'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
