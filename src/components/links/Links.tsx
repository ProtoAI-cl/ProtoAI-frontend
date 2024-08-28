export const Links = () => {
  const reposLinks = [
    {
      title: "Frontend",
      url: "https://github.com/JoseFredes/protoai-front",
    },
    {
      title: "API",
      url: "https://github.com/JoseFredes/protoai",
    },
    {
      title: "Raspberry PI API",
      url: "https://github.com/lore-is-already-taken/protesis",
    },
  ];

  return (
    <div>
      <h2>Links de los repositorios</h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {reposLinks.map((link, index) => (
          <a key={index} href={link.url}>
            {link.title}
          </a>
        ))}
      </div>
    </div>
  );
};
