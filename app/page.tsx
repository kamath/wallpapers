import Geometry from "@/components/geometry";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-12">
      <h1 className="text-2xl font-bold text-gray-800 text-center">
        Github:{" "}
        <a
          href="https://github.com/kamath/wallpapers"
          className="text-blue-500"
        >
          kamath/wallpapers
        </a>
      </h1>
      <Geometry />
      <div className="max-w-[450px] flex flex-col gap-2 text-gray-600 text-left px-4">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          What am I looking at?
        </h1>
        <p>
          As a math major, I took a class called Geometry, where we studied
          visual symmetry through the lens of abstract algebra.
        </p>
        <p>
          In it, we learned about the 17 &quot;wallpaper groups&quot; and that
          there are provably only 17 different ways to tile a plane, i.e. there
          are 17 different ways in which you can arrange identical shapes to
          completely cover a plane while maintaining perfect symmetry. You can
          achieve these patterns by applying a combination of translations,
          rotations, and reflections to a single &quot;motif&quot;.
        </p>
        <p>
          I found{" "}
          <a
            href="https://math.hws.edu/eck/js/symmetry/wallpaper.html"
            className="text-blue-500"
          >
            this fun page
          </a>{" "}
          that interactively illustrates each wallpaper pattern, and I wanted to
          see what happens when you apply different wallpaper patterns to a
          dynamic motif.
        </p>
        <p>
          The motif is a simple square that moves in a random snake-like path.
          The transformations are applied to the square as specified, then
          tessellated across the plane.
        </p>
        <h3 className="text-lg font-bold text-gray-800">Learn more</h3>
        <ul>
          <li>
            <a
              href="https://www.integral-domain.org/lwilliams/WallpaperGroups/p1.php"
              className="text-blue-500"
            >
              Click here
            </a>{" "}
            for a detailed explanation of the wallpaper patterns.
          </li>
          <li>
            <a
              href="https://math.hws.edu/eck/js/symmetry/symmetry-info.html"
              className="text-blue-500"
            >
              Click here
            </a>{" "}
            for the inspiration for this project.
          </li>
        </ul>
      </div>
    </div>
  );
}
