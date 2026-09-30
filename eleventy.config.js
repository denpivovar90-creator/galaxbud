module.exports = function (eleventyConfig) {
  // копіюємо статику як є
  eleventyConfig.addPassthroughCopy({ "src/img": "." });
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/script.js");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
