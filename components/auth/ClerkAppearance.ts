// Shared Clerk appearance configuration
import { Appearance } from '@clerk/types';

export const clerkAppearance: Appearance = {
  elements: {
    // Form button styling - enhanced with gradient and better hover effects
    formButtonPrimary: "bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 w-full flex items-center justify-center space-x-2 relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
    
    // Card and header styling
    card: "bg-transparent shadow-none",
    headerTitle: "text-2xl sm:text-3xl font-bold text-white mb-2",
    headerSubtitle: "hidden",
    
    // Form field styling - enhanced with better focus states and animations
    formFieldLabel: "text-gray-300 font-medium mb-2 transition-colors",
    formFieldInput: "bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600",
    
    // Identity preview styling
    identityPreviewText: "text-gray-200 font-medium",
    identityPreviewEditButton: "text-[#f97316] hover:text-[#fb923c] transition-colors duration-200",
    formFieldInputShowPasswordButton: "text-gray-400 hover:text-[#f97316] transition-colors duration-200",
    
    // Links and actions
    formFieldAction: "text-[#f97316] hover:text-[#fb923c] font-medium transition-colors duration-200 hover:underline",
    
    // Divider styling
    dividerLine: "bg-gray-700 h-0.5 rounded-full",
    dividerText: "text-gray-400 text-sm font-medium px-3 bg-[#1e1e1e]",
    
    // Social buttons styling - more modern and consistent
    socialButtonsBlockButton: "bg-[#2a2a2a] hover:bg-[#333333] border-2 border-gray-700 hover:border-gray-600 text-white rounded-xl py-3 transition-all duration-200 shadow-md hover:shadow-lg",
    socialButtonsBlockButtonText: "text-white font-medium",
    socialButtonsBlockButtonArrow: "text-gray-400",
    socialButtonsIconButton: "bg-[#2a2a2a] hover:bg-[#333333] border-2 border-gray-700 hover:border-gray-600 text-white rounded-xl p-3 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105",
    
    // OTP field styling
    otpCodeFieldInput: "border-2 border-gray-700 text-white bg-[#2a2a2a] rounded-xl p-4 focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-200 text-center font-bold text-xl",
    
    // Error messages
    formFieldErrorText: "text-red-400 text-sm mt-1.5 font-medium",
    
    // Footer
    footer: "hidden",
    footerAction: "hidden",
    footerActionText: "hidden",
    footerActionLink: "hidden",
    
    // Development mode footer
    poweredByLink: "bg-[#121212] text-gray-500 opacity-50 hover:opacity-100 transition-opacity duration-200",
    
    // Additional elements
    alert: "bg-[#2a2a2a] border-l-4 border-[#f97316] text-white p-4 rounded-r-xl shadow-md",
    alertText: "text-gray-200",
    alternativeMethodsBlockButton: "text-[#f97316] hover:text-[#fb923c] font-medium transition-colors duration-200 underline-offset-2 hover:underline",
  },
  layout: {
    socialButtonsVariant: "iconButton" as const,
    socialButtonsPlacement: "bottom" as const,
    showOptionalFields: false,
    shimmer: true,
  },
  variables: {
    colorPrimary: '#f97316', // Orange-500
    colorTextOnPrimaryBackground: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#d1d5db', // Gray-300 - brighter for better readability
    colorBackground: '#1e1e1e',
    colorInputBackground: '#2a2a2a',
    colorInputText: '#ffffff',
    colorDanger: '#ef4444', // Red-500 - brighter for better visibility
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '0.75rem', // Slightly larger border radius
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700
    },
    // Custom font sizes - using string format for TypeScript compatibility
    spacingUnit: '0.25rem',
    // Custom shadows are applied via CSS classes instead
  }
};
