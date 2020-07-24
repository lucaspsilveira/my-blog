import React from "react"
import { Link } from "gatsby"
import { rhythm } from "../utils/typography"

const PostCard = (props) => {
    return (
        <article key={props.node.fields.slug}>
            <header>
              <h3
                style={{
                  marginBottom: rhythm(1 / 4),
                }}
              >
                <Link style={{ boxShadow: `none` }} to={props.node.fields.slug}>
                  {props.title}
                </Link>
              </h3>
              <small>{props.node.frontmatter.date}</small>
            </header>
            <section>
              <p
                dangerouslySetInnerHTML={{
                  __html: props.node.frontmatter.description || props.node.excerpt,
                }}
              />
            </section>
          </article>
    )
}

export default PostCard