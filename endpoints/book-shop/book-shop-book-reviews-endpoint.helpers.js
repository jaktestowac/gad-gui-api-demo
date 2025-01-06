const { searchForBookShopBookReviews } = require("../../helpers/db-operations/db-book-shop.operations");
const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { roundNumber } = require("../../helpers/number.helper");
const { HTTP_NOT_FOUND, HTTP_OK } = require("../../helpers/response.helpers");

function getGeneralReviewStats(bookIds) {
  const reviewsStats = bookIds.map((bookId) => {
    const reviews = searchForBookShopBookReviews(bookId);
    const numberOfReviews = reviews.length;
    if (numberOfReviews === 0) {
      return {
        book_id: bookId,
        mean: 0,
        numberOfReviews,
      };
    }

    const sumOfRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const meanRating = sumOfRating / numberOfReviews;
    const meanRatingRounded = roundNumber(meanRating, 1);

    return {
      book_id: bookId,
      mean: meanRatingRounded,
      numberOfReviews,
    };
  });

  return reviewsStats;
}

function handleBookShopBookReviews(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-book-reviews?book_id")) {
    const bookId = req.query.book_id;
    if (req.url.includes("book_ids=") && req.url.includes("mean=")) {
      const bookIds = req.query.book_ids.split(",");

      logDebug("handleBookShopBookReviews: GET Reviews for bookIds", { bookIds });
      const reviewsStats = getGeneralReviewStats(bookIds);

      res.status(HTTP_OK).send(reviewsStats);
      return true;
    } else if (req.url.includes("book_id=") && req.url.includes("mean=")) {
      logDebug("handleBookShopBookReviews: GET Reviews for bookId", { bookId });
      const reviewsStats = getGeneralReviewStats([bookId]);

      res.status(HTTP_OK).send(reviewsStats[0]);
      return true;
    } else if (req.url.includes("book_id=")) {
      logDebug("handleBookShopBookReviews: GET Reviews for bookId", { bookId });
      const reviews = searchForBookShopBookReviews(bookId);

      reviews.forEach((review) => {
        review.author = "Anonymous";
      });

      res.status(HTTP_OK).send(reviews);
      return true;
    } else {
      logDebug("handleBookShopBookReviews: Resource not Found", { url: req.url, urlEnds });
      res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
    }
  } else if (req.method === "GET" && req.url.includes("/api/book-shop-book-reviews")) {
    logDebug("handleBookShopBookReviews: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  } else {
    logDebug("handleBookShopBookReviews: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopBookReviews,
};
