import React, { useEffect, useMemo, useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import type { NotebookPage } from '@mathnotes/mobile-ink';
import { createPageThumbnail } from '../../services/thumbnailService';

export function PageThumbnailImage({ page, pageIndex, backgroundType, pdfUri, style }: {
  page: NotebookPage;
  pageIndex: number;
  backgroundType: string;
  pdfUri?: string | null;
  style: StyleProp<ImageStyle>;
}) {
  const renderPage = useMemo(() => ({
    id: page.id, title: '', rotation: 0, data: page.data, previewUri: page.previewUri,
    insertedElements: page.insertedElements, textBoxes: page.textBoxes,
    pageType: page.pageType, pdfPageNumber: page.pdfPageNumber,
  }), [page.id, page.data, page.previewUri, page.insertedElements, page.textBoxes,
    page.pageType, page.pdfPageNumber]);
  const [cover, setCover] = useState<{ page: NotebookPage; uri: string | null } | null>(null);
  const uri = cover?.page === renderPage ? cover.uri : renderPage.previewUri;
  useEffect(() => {
    let active = true;
    void createPageThumbnail(renderPage, backgroundType, pdfUri, pageIndex, () => !active)
      .then(next => { if (active) setCover({ page: renderPage, uri: next }); })
      .catch(() => { if (active) setCover({ page: renderPage, uri: renderPage.previewUri ?? null }); });
    return () => { active = false; };
  }, [renderPage, backgroundType, pdfUri, pageIndex]);
  return uri ? <Image source={{ uri }} style={style} resizeMode="cover" /> : null;
}
