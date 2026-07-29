import { withBasePath } from "../lib/site-path";

type ResponsivePhotoProps = {
  name: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  loading?: "eager" | "lazy";
};

export function ResponsivePhoto({
  name,
  alt,
  width,
  height,
  sizes,
  loading = "lazy",
}: ResponsivePhotoProps) {
  const imagePath = (suffix: string): `/${string}` =>
    `/images/photography/${name}${suffix}`;

  return (
    <picture className="responsive-photo">
      <source
        type="image/webp"
        srcSet={`${withBasePath(imagePath("-900.webp"))} 900w, ${withBasePath(
          imagePath("-1800.webp"),
        )} 1800w`}
        sizes={sizes}
      />
      <img
        src={withBasePath(imagePath("-1800.jpg"))}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
      />
    </picture>
  );
}
