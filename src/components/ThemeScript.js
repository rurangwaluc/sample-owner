export default function ThemeScript() {
  const script = `
    (function () {
      try {
        var storageKey = "bcs-owner-theme";
        var saved = localStorage.getItem(storageKey);
        var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = saved === "light" || saved === "dark"
          ? saved
          : (systemDark ? "dark" : "light");

        var root = document.documentElement;
        if (theme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
