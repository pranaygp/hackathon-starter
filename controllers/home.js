/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  console.log("Got / request")
  res.render('home', {
    title: 'Home'
  });
};
