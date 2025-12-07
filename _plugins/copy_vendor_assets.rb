# frozen_string_literal: true

Jekyll::Hooks.register :site, :post_write do |site|
  # Run the npm script to copy vendor assets
  Jekyll.logger.info "Vendor Assets:", "Running npm copy-assets script..."
  
  # Execute npm run copy-assets
  success = system("npm run copy-assets --silent")
  
  if success
    Jekyll.logger.info "Vendor Assets:", "Successfully copied vendor assets"
  else
    Jekyll.logger.warn "Vendor Assets:", "Failed to copy vendor assets"
  end
end