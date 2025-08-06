// Sample data structure for test results
let testResults = [
    {
        id: 1,
        nutrientType: 'vitamin-d',
        nutrientName: 'Vitamin D',
        testValue: 75,
        unit: 'ng/mL',
        testDate: '2024-08-01',
        previousValue: 45,
        status: 'improving'
    },
    {
        id: 2,
        nutrientType: 'iron',
        nutrientName: 'Iron',
        testValue: 90,
        unit: 'µg/dL',
        testDate: '2024-08-01',
        previousValue: 65,
        status: 'optimal'
    },
    {
        id: 3,
        nutrientType: 'b12',
        nutrientName: 'B12',
        testValue: 200,
        unit: 'pg/mL',
        testDate: '2024-08-01',
        previousValue: 180,
        status: 'needs-attention'
    }
];

// Nutrient reference ranges for status calculation
const nutrientRanges = {
    'vitamin-d': { min: 30, max: 100, optimal: 50 },
    'iron': { min: 60, max: 170, optimal: 100 },
    'b12': { min: 200, max: 900, optimal: 500 },
    'magnesium': { min: 1.7, max: 2.2, optimal: 2.0 },
    'vitamin-a': { min: 20, max: 80, optimal: 50 },
    'zinc': { min: 60, max: 120, optimal: 90 }
};

// Initialize the dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    renderProgressCards();
    renderTrendChart();
    setDefaultDate();
});

// Set default date to today in the form
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('testDate').value = today;
}

// Open the add result modal
function openAddResultModal() {
    document.getElementById('addResultModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close the add result modal
function closeAddResultModal() {
    document.getElementById('addResultModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addResultForm').reset();
    setDefaultDate();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addResultModal');
    if (event.target === modal) {
        closeAddResultModal();
    }
}

// Add new test result
function addNewResult(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const testDate = formData.get('testDate');
    const nutrientType = formData.get('nutrientType');
    const testValue = parseFloat(formData.get('testValue'));
    const unit = formData.get('unit');
    
    // Get nutrient name
    const nutrientNames = {
        'vitamin-d': 'Vitamin D',
        'iron': 'Iron',
        'b12': 'B12',
        'magnesium': 'Magnesium',
        'vitamin-a': 'Vitamin A',
        'zinc': 'Zinc'
    };
    
    // Find previous result for this nutrient
    const previousResult = testResults
        .filter(result => result.nutrientType === nutrientType)
        .sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0];
    
    const previousValue = previousResult ? previousResult.testValue : null;
    
    // Calculate status based on reference ranges
    const status = calculateStatus(nutrientType, testValue);
    
    // Create new result object
    const newResult = {
        id: Date.now(),
        nutrientType: nutrientType,
        nutrientName: nutrientNames[nutrientType],
        testValue: testValue,
        unit: unit,
        testDate: testDate,
        previousValue: previousValue,
        status: status
    };
    
    // Add to results array
    testResults.push(newResult);
    
    // Update the dashboard
    renderProgressCards();
    renderTrendChart();
    
    // Close modal and show success message
    closeAddResultModal();
    showNotification('Test result added successfully!', 'success');
}

// Calculate status based on nutrient ranges
function calculateStatus(nutrientType, value) {
    const ranges = nutrientRanges[nutrientType];
    if (!ranges) return 'needs-attention';
    
    if (value >= ranges.min && value <= ranges.max) {
        if (value >= ranges.optimal * 0.8 && value <= ranges.optimal * 1.2) {
            return 'optimal';
        } else {
            return 'improving';
        }
    } else {
        return 'needs-attention';
    }
}

// Render progress cards
function renderProgressCards() {
    const progressCardsContainer = document.getElementById('progressCards');
    
    // Get latest result for each nutrient type
    const latestResults = {};
    testResults.forEach(result => {
        if (!latestResults[result.nutrientType] || 
            new Date(result.testDate) > new Date(latestResults[result.nutrientType].testDate)) {
            latestResults[result.nutrientType] = result;
        }
    });
    
    // Generate HTML for each latest result
    const cardsHTML = Object.values(latestResults).map(result => {
        const change = result.previousValue ? result.testValue - result.previousValue : 0;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeText = change >= 0 ? `+${change}` : `${change}`;
        
        // Calculate progress percentage based on reference ranges
        const ranges = nutrientRanges[result.nutrientType];
        let progressPercentage = 50; // default
        if (ranges) {
            progressPercentage = Math.min(100, Math.max(0, 
                ((result.testValue - ranges.min) / (ranges.max - ranges.min)) * 100));
        }
        
        const statusText = {
            'improving': 'Burning Brighter',
            'optimal': 'Fully Fueled',
            'needs-attention': 'Needs More Fuel'
        };
        
        return `
            <div class="progress-card">
                <div class="progress-header">
                    <h4>${result.nutrientName}</h4>
                    <span class="status ${result.status}">${statusText[result.status]}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-stats">
                    <span class="current">${result.testValue} ${result.unit}</span>
                    ${result.previousValue ? `<span class="previous">${result.previousValue} ${result.unit}</span>` : ''}
                    ${result.previousValue ? `<span class="change ${changeClass}">${changeText}</span>` : ''}
                </div>
                <div class="test-date">Last tested: ${formatDate(result.testDate)}</div>
            </div>
        `;
    }).join('');
    
    progressCardsContainer.innerHTML = cardsHTML;
}

// Render trend chart
function renderTrendChart() {
    const chartContainer = document.getElementById('trendChart');
    
    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentResults = testResults.filter(result => 
        new Date(result.testDate) >= sixMonthsAgo
    ).sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
    
    // Group results by month
    const monthlyData = {};
    recentResults.forEach(result => {
        const month = result.testDate.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = [];
        }
        monthlyData[month].push(result);
    });
    
    // Generate chart points
    const months = Object.keys(monthlyData).sort();
    const chartPointsHTML = months.map((month, index) => {
        const avgValue = monthlyData[month].reduce((sum, result) => sum + result.testValue, 0) / monthlyData[month].length;
        const percentage = Math.min(100, Math.max(0, (avgValue / 100) * 100)); // Normalize to 0-100
        const left = (index / (months.length - 1)) * 100;
        
        return `<div class="chart-point" style="left: ${left}%; bottom: ${percentage}%"></div>`;
    }).join('');
    
    chartContainer.innerHTML = chartPointsHTML;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27AE60' : '#3498DB'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.openAddResultModal = openAddResultModal;
window.closeAddResultModal = closeAddResultModal;
window.addNewResult = addNewResult; 