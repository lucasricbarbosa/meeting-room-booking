import Image from "next/image";

// Photo by Craig Lovelidge (Unsplash License), stored locally so the page does not depend on an external host:
// https://unsplash.com/photos/an-empty-conference-room-with-desks-and-chairs-bV5dFLEYecM
export function SignInAside() {
  return (
    <div className="relative hidden bg-muted lg:block">
      <Image
        src="/images/sign-in-meeting-room.jpg"
        alt="Sala de reunião vazia com mesa e cadeiras"
        fill
        sizes="50vw"
        className="object-cover"
      />
    </div>
  );
}
