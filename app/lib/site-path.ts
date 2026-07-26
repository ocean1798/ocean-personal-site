const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(pathname: `/${string}`) {
  return `${basePath}${pathname}`;
}
