// Content script for the comparison website
// This bridges communication between the website and the extension

console.log("Israeli Supermarket Extension: Bridge loaded");

// Listen for messages from the page
window.addEventListener("message", (event) => {
  // Only accept messages from our own window
  if (event.source !== window) return;

  if (event.data.type === "EXPORT_TO_RETAILER") {
    console.log("Extension received export request:", event.data);

    // Forward to background script
    chrome.runtime.sendMessage(
      {
        action: "exportToRetailer",
        data: event.data.payload,
      },
      (response) => {
        if (response && response.success) {
          // Notify the page that export was successful
          window.postMessage(
            {
              type: "EXPORT_SUCCESS",
              retailer: event.data.payload.retailer,
            },
            "*"
          );
        }
      }
    );
  }
});

// Inject a helper script into the page context
const script = document.createElement("script");
script.textContent = `
  window.exportToRetailer = function(retailer, items) {
    window.postMessage({
      type: "EXPORT_TO_RETAILER",
      payload: { retailer, items }
    }, "*");
  };
`;
document.documentElement.appendChild(script);
script.remove();
