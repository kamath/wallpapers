import Geometry from "@/components/geometry";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-12">
      <Geometry />
      <div className="max-w-[450px] text-center flex flex-col gap-2 text-gray-600 text-left">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          What am I looking at?
        </h1>
        <p>
          As a math major, I took an class called Geometry, where we studied
          visual symmetry through the lens of abstract algebra.
        </p>
        <p>
          In it, we learned about &quot;wallpaper groups&quot; and that there
          are provably only 17 different ways to tile a plane, i.e. there are 17
          different ways in which you can arrange identical shapes to completely
          cover a plane while maintaining perfect symmetry. You can achieve
          these patterns by applying a combination of translations, rotations,
          and reflections to a single &quot;motif&quot;.
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
        <p>The motif is a simple square with a</p>
      </div>
    </div>
  );
}
