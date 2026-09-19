type UserAvatarProps = {
  name: string;
  email: string;
  image: string | null;
  large?: boolean;
};

function getInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

export function UserAvatar({ name, email, image, large = false }: UserAvatarProps) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 font-bold text-indigo-700 ${large ? "size-20 text-xl" : "size-10 text-sm"}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="size-full object-cover" src={image} />
      ) : (
        getInitials(name, email)
      )}
    </span>
  );
}
