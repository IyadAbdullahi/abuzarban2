/**
 * Custom Popup System for Electron Apps
 * Replaces native alert() and confirm() with beautiful custom popups
 * Version: 1.0.0
 */

class CustomPopup {
    constructor() {
        this.overlay = null;
        this.icon = null;
        this.title = null;
        this.message = null;
        this.buttonsContainer = null;
        this.resolvePromise = null;
        
        this.init();
    }

    init() {
        this.createPopupStructure();
        this.setupEventListeners();
    }

    createPopupStructure() {
        // Create popup HTML structure dynamically
        const popupHTML = `
            <div id="customPopup" class="popup-overlay">
                <div class="popup-container">
                    <div class="popup-header">
                        <div id="popupIcon" class="popup-icon">
                            <i></i>
                        </div>
                        <h3 id="popupTitle" class="popup-title"></h3>
                        <p id="popupMessage" class="popup-message"></p>
                    </div>
                    <div class="popup-body">
                        <div id="popupButtons" class="popup-buttons">
                            <!-- Buttons will be dynamically added here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to document if not already present
        if (!document.getElementById('customPopup')) {
            document.body.insertAdjacentHTML('beforeend', popupHTML);
        }

        // Get references to elements
        this.overlay = document.getElementById('customPopup');
        this.icon = document.getElementById('popupIcon');
        this.title = document.getElementById('popupTitle');
        this.message = document.getElementById('popupMessage');
        this.buttonsContainer = document.getElementById('popupButtons');
    }

    setupEventListeners() {
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.hide();
            }
        });
    }

    show(config) {
        const {
            type = 'info',
            title = 'Notification',
            message = '',
            buttons = [{ text: 'OK', action: () => this.hide() }]
        } = config;

        // Set icon based on type
        this.icon.className = `popup-icon ${type}`;
        const iconMap = {
            confirm: '⚠️',
            alert: '❌',
            success: '✅',
            info: 'ℹ️'
        };
        this.icon.querySelector('i').textContent = iconMap[type] || 'ℹ️';

        // Set content
        this.title.textContent = title;
        this.message.textContent = message;

        // Clear and add buttons
        this.buttonsContainer.innerHTML = '';
        buttons.forEach((button, index) => {
            const btn = document.createElement('button');
            btn.className = `popup-btn ${button.class || (index === 0 ? 'primary' : 'secondary')}`;
            btn.textContent = button.text;
            btn.onclick = () => {
                if (button.action) {
                    button.action();
                } else {
                    this.hide();
                }
            };
            this.buttonsContainer.appendChild(btn);
        });

        // Show popup
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first button for accessibility
        const firstButton = this.buttonsContainer.querySelector('.popup-btn');
        if (firstButton) {
            setTimeout(() => firstButton.focus(), 100);
        }

        // Return promise for async handling
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    hide() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        if (this.resolvePromise) {
            this.resolvePromise();
            this.resolvePromise = null;
        }
    }

    // Convenience methods
    confirm(message, title = 'Confirm Action', options = {}) {
        const {
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'danger',
            cancelClass = 'secondary'
        } = options;

        return new Promise((resolve) => {
            this.show({
                type: 'confirm',
                title,
                message,
                buttons: [
                    {
                        text: cancelText,
                        class: cancelClass,
                        action: () => {
                            this.hide();
                            resolve(false);
                        }
                    },
                    {
                        text: confirmText,
                        class: confirmClass,
                        action: () => {
                            this.hide();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    alert(message, title = 'Alert', options = {}) {
        const { buttonText = 'OK', buttonClass = 'primary' } = options;
        
        return this.show({
            type: 'alert',
            title,
            message,
            buttons: [{ 
                text: buttonText, 
                class: buttonClass,
                action: () => this.hide()
            }]
        });
    }

    success(message, title = 'Success', options = {}) {
        const { buttonText = 'OK', buttonClass = 'primary' } = options;
        
        return this.show({
            type: 'success',
            title,
            message,
            buttons: [{ 
                text: buttonText, 
                class: buttonClass,
                action: () => this.hide()
            }]
        });
    }

    info(message, title = 'Information', options = {}) {
        const { buttonText = 'OK', buttonClass = 'primary' } = options;
        
        return this.show({
            type: 'info',
            title,
            message,
            buttons: [{ 
                text: buttonText, 
                class: buttonClass,
                action: () => this.hide()
            }]
        });
    }

    // Custom popup with multiple buttons
    custom(config) {
        return this.show(config);
    }
}

// Auto-initialize when DOM is ready
let customPopupInstance = null;

function initializeCustomPopup() {
    if (!customPopupInstance) {
        customPopupInstance = new CustomPopup();
        
        // Make globally available
        window.customPopup = customPopupInstance;
        
        // Backward compatibility aliases
        window.showConfirm = customPopupInstance.confirm.bind(customPopupInstance);
        window.showAlert = customPopupInstance.alert.bind(customPopupInstance);
        window.showSuccess = customPopupInstance.success.bind(customPopupInstance);
        window.showInfo = customPopupInstance.info.bind(customPopupInstance);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCustomPopup);
} else {
    initializeCustomPopup();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomPopup;
}

if (typeof window !== 'undefined') {
    window.CustomPopup = CustomPopup;
}