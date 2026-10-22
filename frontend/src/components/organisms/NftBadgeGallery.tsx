'use client';

import { useOwnedNfts } from '@/hooks/useOwnedNfts';

interface NftBadgeGalleryProps {
  owner?: string | null;
}

const NftBadgeGallery = ({ owner }: NftBadgeGalleryProps) => {
  const { nfts, isLoading, error } = useOwnedNfts(owner);

  if (isLoading) return <p className="text-sm text-gray-500">Loading badges…</p>;
  if (error) return <p className="text-sm text-red-500">Could not load badges.</p>;
  if (nfts.length === 0) return <p className="text-sm text-gray-500">No badges yet.</p>;

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {nfts.map(({ tokenId, uri }) => (
        <li key={tokenId.toString()} className="flex flex-col items-center gap-2">
          <img src={uri} alt={`Badge #${tokenId}`} className="w-24 h-24 object-contain" />
          <span className="text-xs text-gray-600">Badge #{tokenId.toString()}</span>
        </li>
      ))}
    </ul>
  );
};

export default NftBadgeGallery;
