export const resolveListingTypeLabel = (listingType, listingTypeName, listingTypes = []) => {
  if (listingTypeName && String(listingTypeName).trim()) {
    return String(listingTypeName).trim();
  }

  const rawValue = listingType == null ? '' : String(listingType).trim();
  if (!rawValue) return '-';

  const normalizedRaw = rawValue.toLowerCase();
  const match = listingTypes.find((item) => {
    const id = item?.id == null ? '' : String(item.id).trim().toLowerCase();
    const slug = item?.slug == null ? '' : String(item.slug).trim().toLowerCase();
    const name = item?.name == null ? '' : String(item.name).trim().toLowerCase();
    return normalizedRaw === id || normalizedRaw === slug || normalizedRaw === name;
  });

  if (match?.name) {
    return String(match.name).trim();
  }

  return rawValue.replace(/_/g, ' ');
};