import { notFound } from 'next/navigation';
import { PageEditor } from '@/components/PageEditor';

interface PageEditorPageProps {
  params: {
    pageId: string;
  };
}

export default function PageEditorPage({ params }: PageEditorPageProps) {
  return <PageEditor pageId={params.pageId} />;
} 