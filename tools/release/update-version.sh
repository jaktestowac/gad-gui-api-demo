#!/bin/bash

# GAD Version Update Script
# Updates version in all relevant files: package.json, app.json, public/version.js, and tools/release/README.md
# Usage: ./update-version.sh [major|minor|patch] [new_version]
# Examples:
#   ./update-version.sh patch           # Increments patch version (2.8.5 -> 2.8.6)
#   ./update-version.sh minor           # Increments minor version (2.8.5 -> 2.9.0)
#   ./update-version.sh major           # Increments major version (2.8.5 -> 3.0.0)
#   ./update-version.sh custom 3.1.4    # Sets specific version

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory (assuming script is in tools/release/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Files to update
PACKAGE_JSON="$PROJECT_ROOT/package.json"
APP_JSON="$PROJECT_ROOT/app.json"
VERSION_JS="$PROJECT_ROOT/public/version.js"
RELEASE_README="$PROJECT_ROOT/tools/release/README.md"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate semantic version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format: $version"
        print_error "Version must be in format: MAJOR.MINOR.PATCH (e.g., 2.8.5)"
        exit 1
    fi
}

# Function to extract current version from package.json
get_current_version() {
    if [[ ! -f "$PACKAGE_JSON" ]]; then
        print_error "package.json not found at: $PACKAGE_JSON"
        exit 1
    fi
    
    # Extract version using grep and sed (more portable than jq)
    local current_version=$(grep '"version"' "$PACKAGE_JSON" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
    
    if [[ -z "$current_version" ]]; then
        print_error "Could not extract current version from package.json"
        exit 1
    fi
    
    echo "$current_version"
}

# Function to increment version based on type
increment_version() {
    local current_version=$1
    local increment_type=$2
    
    # Split version into components
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $increment_type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            print_error "Invalid increment type: $increment_type"
            print_error "Valid types: major, minor, patch"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to update package.json
update_package_json() {
    local new_version=$1
    print_info "Updating package.json..."
    
    # Create backup
    cp "$PACKAGE_JSON" "$PACKAGE_JSON.bak"
    
    # Update version in package.json
    sed -i.tmp "s/\"version\": *\"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
    rm -f "$PACKAGE_JSON.tmp"
    
    print_success "Updated package.json"
}

# Function to update app.json
update_app_json() {
    local new_version=$1
    print_info "Updating app.json..."
    
    if [[ -f "$APP_JSON" ]]; then
        # Create backup
        cp "$APP_JSON" "$APP_JSON.bak"
        
        # Update version in app.json (with "v" prefix)
        sed -i.tmp "s/\"version\": *\"v[^\"]*\"/\"version\": \"v$new_version\"/" "$APP_JSON"
        rm -f "$APP_JSON.tmp"
        
        print_success "Updated app.json"
    else
        print_warning "app.json not found, skipping..."
    fi
}

# Function to update public/version.js
update_version_js() {
    local new_version=$1
    print_info "Updating public/version.js..."
    
    if [[ -f "$VERSION_JS" ]]; then
        # Create backup
        cp "$VERSION_JS" "$VERSION_JS.bak"
        
        # Update version in version.js (with "v" prefix)
        sed -i.tmp "s/const appVersion = \"v[^\"]*\"/const appVersion = \"v$new_version\"/" "$VERSION_JS"
        rm -f "$VERSION_JS.tmp"
        
        print_success "Updated public/version.js"
    else
        print_warning "public/version.js not found, skipping..."
    fi
}

# Function to update tools/release/README.md
update_release_readme() {
    local new_version=$1
    print_info "Updating tools/release/README.md..."
    
    if [[ -f "$RELEASE_README" ]]; then
        # Create backup
        cp "$RELEASE_README" "$RELEASE_README.bak"
        
        # Update git tag commands (with "v" prefix)
        sed -i.tmp "s/git tag v[0-9]\+\.[0-9]\+\.[0-9]\+/git tag v$new_version/" "$RELEASE_README"
        sed -i.tmp "s/git push upstream v[0-9]\+\.[0-9]\+\.[0-9]\+/git push upstream v$new_version/" "$RELEASE_README"
        rm -f "$RELEASE_README.tmp"
        
        print_success "Updated tools/release/README.md"
    else
        print_warning "tools/release/README.md not found, skipping..."
    fi
}

# Function to update package-lock.json if it exists
update_package_lock() {
    local new_version=$1
    local package_lock="$PROJECT_ROOT/package-lock.json"
    
    if [[ -f "$package_lock" ]]; then
        print_info "Updating package-lock.json..."
        
        # Create backup
        cp "$package_lock" "$package_lock.bak"
        
        # Update version in package-lock.json (only the main project version, not dependencies)
        sed -i.tmp "1,10s/\"version\": *\"[^\"]*\"/\"version\": \"$new_version\"/" "$package_lock"
        rm -f "$package_lock.tmp"
        
        print_success "Updated package-lock.json"
    else
        print_warning "package-lock.json not found, skipping..."
    fi
}

# Function to clean up backup files
cleanup_backups() {
    print_info "Cleaning up backup files..."
    find "$PROJECT_ROOT" -name "*.bak" -type f -delete 2>/dev/null || true
    print_success "Cleanup completed"
}

# Function to restore from backups in case of error
restore_backups() {
    print_warning "Restoring from backups due to error..."
    find "$PROJECT_ROOT" -name "*.bak" -type f | while read backup_file; do
        original_file="${backup_file%.bak}"
        mv "$backup_file" "$original_file"
        print_info "Restored: $original_file"
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [major|minor|patch|custom] [new_version]"
    echo ""
    echo "Examples:"
    echo "  $0 patch           # Increments patch version (2.8.5 -> 2.8.6)"
    echo "  $0 minor           # Increments minor version (2.8.5 -> 2.9.0)"
    echo "  $0 major           # Increments major version (2.8.5 -> 3.0.0)"
    echo "  $0 custom 3.1.4    # Sets specific version to 3.1.4"
    echo ""
    echo "The script will update version in:"
    echo "  - package.json"
    echo "  - app.json (with 'v' prefix)"
    echo "  - public/version.js (with 'v' prefix)"
    echo "  - tools/release/README.md (git tag commands)"
    echo "  - package-lock.json (if exists)"
}

# Main script logic
main() {
    print_info "GAD Version Update Script"
    print_info "========================"
    
    # Check if we're in the right directory
    if [[ ! -f "$PACKAGE_JSON" ]]; then
        print_error "package.json not found. Please run this script from the project root or check the path."
        exit 1
    fi
    
    # Get current version
    local current_version=$(get_current_version)
    print_info "Current version: $current_version"
    
    # Parse arguments
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    local action=$1
    local new_version=""
    
    case $action in
        "major"|"minor"|"patch")
            new_version=$(increment_version "$current_version" "$action")
            ;;
        "custom")
            if [[ $# -ne 2 ]]; then
                print_error "Custom version requires a version number"
                show_usage
                exit 1
            fi
            new_version=$2
            validate_version "$new_version"
            ;;
        *)
            print_error "Invalid action: $action"
            show_usage
            exit 1
            ;;
    esac
    
    print_info "New version: $new_version"
    
    # Confirm with user
    echo -n "Do you want to update version from $current_version to $new_version? (y/N): "
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        print_info "Version update cancelled"
        exit 0
    fi
    
    # Set up error handling
    trap 'restore_backups; exit 1' ERR
    
    # Update all files
    update_package_json "$new_version"
    update_app_json "$new_version"
    update_version_js "$new_version"
    update_release_readme "$new_version"
    update_package_lock "$new_version"
    
    # Clean up backups on success
    cleanup_backups
    
    print_success "Successfully updated version from $current_version to $new_version"
    print_info ""
    print_info "Updated files:"
    print_info "  ✓ package.json"
    print_info "  ✓ app.json"
    print_info "  ✓ public/version.js"
    print_info "  ✓ tools/release/README.md"
    print_info "  ✓ package-lock.json (if existed)"
    print_info ""
    print_info "Next steps:"
    print_info "  1. Review the changes"
    print_info "  2. Commit the changes: git add . && git commit -m 'chore: bump version to v$new_version'"
    print_info "  3. Create and push tag: git tag v$new_version && git push origin v$new_version"
}

# Run main function with all arguments
main "$@"