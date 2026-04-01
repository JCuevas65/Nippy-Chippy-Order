/**
 * Google Apps Script to receive Nippy Chippy orders and save them to a Google Sheet.
 * 
 * Instructions:
 * 1. Open a Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into the editor.
 * 4. Click 'Deploy' > 'New Deployment'.
 * 5. Select 'Web App'.
 * 6. Set 'Execute as' to 'Me'.
 * 7. Set 'Who has access' to 'Anyone'.
 * 8. Copy the Web App URL and paste it into your app's environment variables.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Column Mapping based on the provided image
    // A: Order Number
    // B: Regular Fish and Chips
    // C: Large Fish and Chips
    // D: Regular Fish
    // E: Large Fish
    // F: Medium Chips
    // G: Large Chips
    // H: Chip Butty
    // I: Coke
    // J: Sprite
    // K: Fanta
    // L: Total Amount
    // M: Order Date & Time
    // N: Status
    
    const items = data.items || [];
    const getItemQty = (name) => {
      const item = items.find(i => i.name === name);
      return item ? item.quantity : 0;
    };

    const row = [
      data.id,                              // A: Order Number
      getItemQty('Regular Fish and Chips'), // B
      getItemQty('Large Fish and Chips'),   // C
      getItemQty('Regular Fish'),           // D
      getItemQty('Large Fish'),             // E
      getItemQty('Medium Chips'),           // F
      getItemQty('Large Chips'),             // G
      getItemQty('Chip Butty'),             // H
      getItemQty('Coke'),                   // I
      getItemQty('Sprite'),                 // J
      getItemQty('Fanta'),                  // K
      data.total,                           // L: Total Amount
      new Date().toLocaleString(),          // M: Order Date & Time
      data.status                           // N: Status
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
