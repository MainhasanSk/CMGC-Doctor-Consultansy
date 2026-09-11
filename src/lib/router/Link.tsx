import React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";

export interface CustomLinkProps extends Omit<RouterLinkProps, "to"> {
  to?: string;
  href?: string;
}

export const Link = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
  ({ to, href, children, ...props }, ref) => {
    const destination = to || href || "#";
    return (
      <RouterLink ref={ref} to={destination} {...props}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = "Link";
export default Link;
