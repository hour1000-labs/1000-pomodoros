export const SITE_NAME = '1000 Pomodoros';
export const SITE_TITLE = '1000 Pomodoros — Visual Progress Tracker';
export const SITE_DESCRIPTION = 'Track focused work, one pomodoro at a time.';
export const SITE_URL = 'https://hour1000-labs.github.io/1000-pomodoros/';
export const SITE_SOCIAL_IMAGE_URL = `${SITE_URL}og-image.png`;

export function getPublicAssetPath(assetPath: string) {
  const baseUrl = import.meta.env.BASE_URL;
  const normalizedAssetPath = assetPath.replace(/^\/+/, '');

  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${normalizedAssetPath}`;
}
