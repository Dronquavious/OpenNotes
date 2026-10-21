import React, { useEffect, useState } from 'react';
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
  const [cover, setCover] = useState<{ page: NotebookPage; uri: string | null } | null>(null);
  const uri = cover?.page === page ? cover.uri : page.previewUri;
  useEffect(() => {
    let active = true;
    void createPageThumbnail(page, backgroundType, pdfUri, pageIndex)
      .then(next => { if (active) setCover({ page, uri: next }); })
      .catch(() => { if (active) setCover({ page, uri: page.previewUri ?? null }); });
    return () => { active = false; };
  }, [page, backgroundType, pdfUri, pageIndex]);
  return uri ? <Image source={{ uri }} style={style} resizeMode="cover" /> : null;
}
