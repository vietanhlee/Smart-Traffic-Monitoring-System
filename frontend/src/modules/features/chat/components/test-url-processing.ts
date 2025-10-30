/**
 * Test file để kiểm tra URL processing trong ChatInterface
 */

// Copy function từ ChatInterface
function addTokenToImageUrl(url: string): string {
  if (!url) return url;

  // Fix double protocol issue (http://http://)
  url = url.replace(/^https?:\/\/https?:\/\//i, (match) => {
    // Keep only the first protocol
    return match.includes("https://https://") ? "https://" : "http://";
  });

  // Remove all existing token parameters first
  url = url.replace(/([?&])token=[^&]+/g, "");
  // Clean up trailing & or ?
  url = url.replace(/[?&]$/, "");

  // Only add token if it's a local API URL
  if (url.includes("localhost:8000") || url.includes("127.0.0.1:8000")) {
    const token = "test-token-123";
    if (token) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}token=${encodeURIComponent(token)}`;
    }
  }
  return url;
}

// Test cases
console.log("=== URL Processing Tests ===\n");

// Test 1: Double http protocol
const test1 = "http://http//localhost:8000/api/v1/frames/Văn Quán";
console.log("Test 1: Double http protocol");
console.log("Input:", test1);
console.log("Output:", addTokenToImageUrl(test1));
console.log(
  "Expected: http://localhost:8000/api/v1/frames/Văn Quán?token=test-token-123\n"
);

// Test 2: Double token
const test2 =
  "http://localhost:8000/api/v1/frames/Văn Quán?token=old-token&token=another-token";
console.log("Test 2: Double token");
console.log("Input:", test2);
console.log("Output:", addTokenToImageUrl(test2));
console.log(
  "Expected: http://localhost:8000/api/v1/frames/Văn Quán?token=test-token-123\n"
);

// Test 3: Normal URL
const test3 = "http://localhost:8000/api/v1/frames/Văn Quán";
console.log("Test 3: Normal URL");
console.log("Input:", test3);
console.log("Output:", addTokenToImageUrl(test3));
console.log(
  "Expected: http://localhost:8000/api/v1/frames/Văn Quán?token=test-token-123\n"
);

// Test 4: URL with existing params
const test4 = "http://localhost:8000/api/v1/frames/Văn Quán?size=large";
console.log("Test 4: URL with existing params");
console.log("Input:", test4);
console.log("Output:", addTokenToImageUrl(test4));
console.log(
  "Expected: http://localhost:8000/api/v1/frames/Văn Quán?size=large&token=test-token-123\n"
);

// Test 5: External URL (should not add token)
const test5 = "https://example.com/image.jpg";
console.log("Test 5: External URL (should not add token)");
console.log("Input:", test5);
console.log("Output:", addTokenToImageUrl(test5));
console.log("Expected: https://example.com/image.jpg\n");

console.log("=== All tests completed ===");
