// src/utils/ReceiptPrinter.js

/**
 * Utility class for handling receipt printing
 * In a real application, this would integrate with physical receipt printers
 * or thermal printer APIs. This implementation is a placeholder that
 * simulates printing by generating a printable HTML receipt.
 */
class ReceiptPrinter {
    /**
     * Print receipt for a sale
     * @param {Object} sale - The sale object containing all transaction details
     */
    printReceipt(sale) {
      console.log(`Printing receipt for sale #${sale.saleNumber}`);
      
      // In a real implementation, this would send data to a physical printer
      // For this example, we'll generate a receipt in a new window
      this.generateReceiptWindow(sale);
      
      return true;
    }
    
    /**
     * Generate a receipt in a new window for printing
     * @param {Object} sale - The sale object
     */
    generateReceiptWindow(sale) {
      // Format currency
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };
      
      // Format date
      const formatDate = (dateString) => {
        const options = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
      };
      
      // Create receipt content
      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${sale.saleNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 300px;
              margin: 0 auto;
              padding: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-name {
              flex: 1;
            }
            .item-price {
              text-align: right;
              min-width: 70px;
            }
            .item-quantity {
              text-align: center;
              min-width: 30px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                width: 100%;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Green Thumb Gardens</div>
            <div>123 Garden Street, Plantville</div>
            <div>(555) 123-4567</div>
            <div>www.greenthumbgardens.example.com</div>
          </div>
          
          <div class="divider"></div>
          
          <div>
            <div>Receipt: ${sale.saleNumber}</div>
            <div>Date: ${formatDate(sale.createdAt)}</div>
            <div>Cashier: ${sale.cashier?.name || 'Staff'}</div>
            ${sale.customer ? `<div>Customer: ${sale.customer.name}</div>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div>
            ${sale.items.map(item => `
              <div class="item-row">
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <div class="item-price">${formatCurrency(item.subtotal)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div>
            <div class="total-row">
              <div>Subtotal:</div>
              <div>${formatCurrency(sale.subtotal)}</div>
            </div>
            <div class="total-row">
              <div>Tax:</div>
              <div>${formatCurrency(sale.taxTotal)}</div>
            </div>
            ${sale.discountTotal > 0 ? `
              <div class="total-row">
                <div>Discount:</div>
                <div>-${formatCurrency(sale.discountTotal)}</div>
              </div>
            ` : ''}
            <div class="total-row">
              <div>TOTAL:</div>
              <div>${formatCurrency(sale.total)}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div>
            ${sale.payments.map(payment => `
              <div class="item-row">
                <div>Payment (${payment.method}):</div>
                <div>${formatCurrency(payment.amount)}</div>
              </div>
            `).join('')}
            ${sale.changeDue > 0 ? `
              <div class="item-row">
                <div>Change:</div>
                <div>${formatCurrency(sale.changeDue)}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div>Thank you for shopping with us!</div>
            <div>GST #: 123-456-789</div>
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">Print Receipt</button>
          </div>
        </body>
        </html>
      `;
      
      // Open a new window with the receipt
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
    }
  }
  
  export const ReceiptPrinter = new ReceiptPrinter();