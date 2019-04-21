"use strict";

exports.paginate = async function(arr, perpage, page) {
  if (arr && arr.length >= 1 ) return await arr.slice(perpage*(page-1), perpage*page);
};