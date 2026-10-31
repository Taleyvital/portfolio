import type { MDXComponents } from "mdx/types";
import { Contacts } from "@/components/Contacts";
import { Schema } from "@/components/Schema";

const components: MDXComponents = {
  Contacts,
  Schema,
  table: (props) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
