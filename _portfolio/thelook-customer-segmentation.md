---
title: "theLook Customer Segmentation"
excerpt: "Customer segmentation based on demographic, RFM analysis, and Cohort analysis using SQL and Pandas"
header:
  teaser: assets/img/theLook-customer-segmentation.png
classes: wide
toc_sticky: true
hidden: true
---

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1BoFoCcNxoqfGQZZVaq7gOdU5W7R5OjYr?usp=sharing)

# Introduction

theLook Ecommerce dataset is a publicly available dataset in Google BigQuery.
It includes information about customers, orders, and products. For this project, I will use SQL and Pandas to perform
customer segmentation
based on demographic, RFM analysis, and Cohort analysis.

For convenience, I ran this project on Google Colab to combine the SQL result with Pandas. To open and run this project,
click the 'Open in Colab' button above. Remember to change the project ID to your own in each
cell of the notebook.

# Analysis

## Demographics Segmentation

The dataset includes demographic information such as `gender`, `age`, and
`country`, which I will use to segment the customers. However, to make the `age` feature more meaningful, it needs to be
grouped into five categories.
`Under 18`, `18-30`, `31-45`, `46-60`, and `Over 60` are the age groups used to group the `age` feature. Here is the
query to perform this grouping:

```sql
CASE
    WHEN age < 18 THEN 'Under 18'
    WHEN age BETWEEN 18 AND 30 THEN '18-30'
    WHEN age BETWEEN 31 AND 45 THEN '31-45'
    WHEN age BETWEEN 46 AND 60 THEN '46-60'
    ELSE 'Over 60'
END AS age_category,
```

By combining this feature with others, we can obtain demographic segmentation grouped by age category, gender, and
country using the following query:

```sql
SELECT
    CASE
        WHEN age < 18 THEN 'Under 18'
        WHEN age BETWEEN 18 AND 30 THEN '18-30'
        WHEN age BETWEEN 31 AND 45 THEN '31-45'
        WHEN age BETWEEN 46 AND 60 THEN '46-60'
        ELSE 'Over 60'
    END AS age_category,
    gender,
    country,
    COUNT(*) AS customer_count
FROM
    bigquery-public-data.thelook_ecommerce.users
GROUP BY
    age_category,
    gender,
    country
ORDER BY
    customer_count DESC
```

The top 5 results of the query are shown in the following table

| age_category | gender | country | customer_count |
|--------------|--------|---------|----------------|
| 46-60        | F      | China   | 4430           |
| 31-45        | F      | China   | 4425           |
| 31-45        | M      | China   | 4208           |
| 46-60        | M      | China   | 4193           |
| 18-30        | M      | China   | 3771           |

The results indicate that most customers are from China, with the majority falling within the 46–60 and 31–45 age
ranges. Additionally, both genders are female.

## RFM Analysis

RFM analysis is a customer segmentation technique that divides customers into groups based on their
past purchase habits. It evaluates customers by scoring them in three categories: how recently they've made a
purchase, how often they buy, and the total amount of the price from their purchases. The following query will retrieve
the `user_id` and the RFM values:

```sql
SELECT
    orders.user_id,
    MAX(orders.created_at) as last_purchase,
    COUNT(*) AS frequency,
    SUM(order_items.sale_price) AS monetary_value
FROM
    bigquery-public-data.thelook_ecommerce.orders orders
    INNER JOIN
        bigquery-public-data.thelook_ecommerce.order_items order_items
    ON
        orders.order_id = order_items.order_id
WHERE
    orders.status = 'Complete'
GROUP BY
    orders.user_id
```

To obtain the most recent purchase date, we can use the function `MAX(orders.created_at) AS last_purchase`. The
frequency can be
determined by counting the number of orders for each customer. The monetary value can be calculated by multiplying the
sale price of the
items, so it reflects the price when the item is ordered, by using `SUM(order_items.sale_price) AS monetary_value`.
Group each entry by `user_id` and consider only completed orders with `WHERE orders.status = 'Complete'`.
The resulting table displays the first five entries.

| user_id | last_purchase                    | frequency | monetary_value |
|--------:|:---------------------------------|----------:|---------------:|
|   42746 | 2024-02-12 01:23:00+00:00        |         8 |         402.49 |
|    5667 | 2020-11-15 03:12:00+00:00        |         7 |         390.94 |
|   39989 | 2024-02-20 16:27:32.139503+00:00 |         7 |         317.27 |
|   48668 | 2022-09-14 11:12:00+00:00        |         7 |         204.88 |
|   80317 | 2023-08-07 15:59:00+00:00        |         6 |         224.14 |

The table, however, only shows each user's summary of their purchases. To get the RFM score, I use Pandas for ease of
use. In pandas there's a method called `qcut` which is Quantile-based discretization function. It discretizes variable
into equal-sized buckets based on rank or based on sample quantiles. I use 5-category scores, and because we are only
interested in the numeric value, we can set the labels to False. Here is the code to get the RFM score:

```python
import pandas as pd

pd.qcut(df[col_name], 5, labels=False, duplicates='drop')
```

Do this for each column, and then combine all scores from each column to get the RFM score. We now have each customer
segmented based on their RFM score under five categories. Here are the first five results of the best customers.

| user_id | last_purchase                    | frequency | monetary_value | rfm_score | rfm_category |
|--------:|:---------------------------------|----------:|---------------:|----------:|:-------------|
|   42746 | 2024-02-12 01:23:00+00:00        |         8 |         402.49 |         9 | Best         |
|   39989 | 2024-02-20 16:27:32.139503+00:00 |         7 |         317.27 |         9 | Best         |
|   80317 | 2023-08-07 15:59:00+00:00        |         6 |         224.14 |         8 | Best         |
|   80986 | 2024-02-14 15:37:00+00:00        |         6 |         222.18 |         9 | Best         |
|   10748 | 2023-09-12 09:01:00+00:00        |         8 |         687.94 |         8 | Best         |

## Cohort Analysis

Cohort analysis is a subset of behavioral analytics that takes the data from a given platform like e-commerce and rather
than looking at all users as one unit; it breaks them into related groups for analysis. These related groups, or
cohorts, usually share common characteristics or experiences within a defined time-span.

### Cohort Items

The first step is to get the first purchase month of each user.

```sql
SELECT
    user_id,
    FORMAT_DATE('%Y-%m-01', MIN(created_at)) AS cohort_month,
FROM
    bigquery-public-data.thelook_ecommerce.orders
GROUP BY
    user_id
ORDER BY
    user_id
```

The `FORMAT_DATE('%Y-%m-01', MIN(created_at))` is used to get the first day of the month of the first purchase each
customer
made. The first five results of the query are shown below.

| user_id | cohort_month |
|--------:|:-------------|
|       1 | 2023-06-01   |
|       2 | 2022-02-01   |
|       3 | 2023-04-01   |
|       4 | 2021-10-01   |
|       5 | 2023-12-01   |

Let's name this table as `cohort_items`.

### User Activities

The next step is to get the unique difference between the first purchase month
and the next purchase month. This is done by using the following query with a combination of previous query:

```sql
WITH cohort_items as (
    SELECT
        user_id,
        FORMAT_DATE('%Y-%m-01', MIN(created_at)) AS cohort_month,
    FROM
        bigquery-public-data.thelook_ecommerce.orders
    GROUP BY
        user_id
    ORDER BY
        user_id
)
SELECT
    orders.user_id,
    DATE_DIFF(DATE(orders.created_at), DATE(ci.cohort_month), MONTH) as month_number
FROM
    bigquery-public-data.thelook_ecommerce.orders orders
    JOIN cohort_items ci ON orders.user_id = ci.user_id
GROUP BY
    orders.user_id,
    month_number
ORDER BY
    orders.user_id,
    month_number
```

Pay attention to the `DATE_DIFF(DATE(orders.created_at), DATE(ci.cohort_month), MONTH) as month_number` part. This is
used to get the difference between the first purchase month and the next purchase month. The first five results of the
query
are shown below.

| user_id | month_number |
|--------:|-------------:|
|       1 |            0 |
|       2 |            0 |
|       2 |            1 |
|       3 |            0 |
|       4 |            0 |

Let's name this table as `user_activities`. Take, for example, user 2, value 1 in the `month_number` means that
user 2 made the second purchase 1 month later after the first purchase. Check out the query and its result below for
clarity.

```sql
SELECT user_id, created_at
FROM bigquery-public-data.thelook_ecommerce.orders
WHERE user_id = 2
```

| user_id | created_at                |
|--------:|:--------------------------|
|       2 | 2022-03-29 13:49:00+00:00 |
|       2 | 2022-02-20 13:49:00+00:00 |

### Cohort Retention Activities

The next step is to count how many users for each first purchase month and the next purchase month. This is done by
using the following query with a combination of previous query:

```sql
WITH cohort_items as (
    SELECT
        user_id,
        FORMAT_DATE('%Y-%m-01', MIN(created_at)) AS cohort_month,
    FROM
        bigquery-public-data.thelook_ecommerce.orders
    GROUP BY
        user_id
    ORDER BY
        user_id
),
user_activities as (
    SELECT
        orders.user_id,
        DATE_DIFF(DATE(orders.created_at), DATE(ci.cohort_month), MONTH) as month_number
    FROM
        bigquery-public-data.thelook_ecommerce.orders orders
        JOIN cohort_items ci ON orders.user_id = ci.user_id
    GROUP BY
        orders.user_id,
        month_number
    ORDER BY
        orders.user_id,
        month_number
)
SELECT
    ci.cohort_month,
    ua.month_number,
    COUNT(*) as num_users
FROM
    user_activities ua
    JOIN cohort_items ci ON ua.user_id = ci.user_id
GROUP BY
    ci.cohort_month,
    ua.month_number
ORDER BY
    ci.cohort_month,
    ua.month_number
```

Let's call this table `cohort_retention_activities`. We only count how many users on each `cohort_month` and
`month_number`. The first five results of the query are shown below.

| cohort_month | month_number | num_users |
|:-------------|-------------:|----------:|
| 2019-01-01   |            0 |        15 |
| 2019-01-01   |            2 |         1 |
| 2019-01-01   |            8 |         1 |
| 2019-01-01   |           10 |         2 |
| 2019-01-01   |           12 |         1 |

### Cohort Size

We're almost done. The next step is to count how many users made their first purchase on each `cohort_month`. This is
done by using the following query with a combination of `cohort_items` table:

```sql
WITH cohort_items as (
    SELECT
        user_id,
        FORMAT_DATE('%Y-%m-01', MIN(created_at)) AS cohort_month,
    FROM
        bigquery-public-data.thelook_ecommerce.orders
    GROUP BY
        user_id
    ORDER BY
        user_id
)
SELECT
    cohort_month,
    COUNT(*) as num_users
FROM
    cohort_items
GROUP BY
    cohort_month
ORDER BY
    cohort_month
```

We call this table `cohort_size`. The first five results of the query are shown below.

| cohort_month | num_users |
|:-------------|----------:|
| 2019-01-01   |        15 |
| 2019-02-01   |        40 |
| 2019-03-01   |        77 |
| 2019-04-01   |       112 |
| 2019-05-01   |       151 |

### Cohort Retention Rate

Finally, the last step is putting it all together to get the proportion of active users (based on the `cohort_size`)
that has completed their first purchase, second purchase, and so on. This is done by using the following query with
a combination of all previous queries:

```sql
WITH cohort_items AS (
    SELECT
        user_id,
        FORMAT_DATE('%Y-%m-01', MIN(created_at)) AS cohort_month,
    FROM
        bigquery-public-data.thelook_ecommerce.orders
    GROUP BY
        user_id
    ORDER BY
        user_id
),

user_activities AS (
    SELECT
        orders.user_id,
        DATE_DIFF(DATE(orders.created_at), DATE(ci.cohort_month), MONTH) AS month_number
    FROM
        bigquery-public-data.thelook_ecommerce.orders orders
        JOIN cohort_items ci ON orders.user_id = ci.user_id
    GROUP BY
        orders.user_id,
        month_number
    ORDER BY
        orders.user_id,
        month_number
),

cohort_retention_activities AS (
    SELECT
        ci.cohort_month,
        ua.month_number,
        COUNT(ci.cohort_month) AS num_users
    FROM
        user_activities ua
        JOIN cohort_items ci ON ua.user_id = ci.user_id
    GROUP BY
        ci.cohort_month,
        ua.month_number
    ORDER BY
        ci.cohort_month,
        ua.month_number
),

cohort_size AS (
    SELECT
        cohort_month,
        COUNT(*) AS num_users
    FROM
        cohort_items
    GROUP BY
        cohort_month
    ORDER BY
        cohort_month
)

SELECT
    cra.cohort_month,
    cs.num_users AS total_users,
    cra.month_number,
    CAST(cra.num_users AS FLOAT64) / cs.num_users * 100 AS percentage
FROM
    cohort_retention_activities cra
    JOIN cohort_size cs ON cra.cohort_month = cs.cohort_month
ORDER BY
    cra.cohort_month,
    cra.month_number
```

The first five entries will look like this

| cohort_month | total_users | month_number | percentage |
|:-------------|------------:|-------------:|-----------:|
| 2019-01-01   |          15 |            0 |        100 |
| 2019-01-01   |          15 |            2 |    6.66667 |
| 2019-01-01   |          15 |            8 |    6.66667 |
| 2019-01-01   |          15 |           10 |    13.3333 |
| 2019-01-01   |          15 |           12 |    6.66667 |

### Parsing and Transforming the Data

We need Pandas to parse and transform the data for visualization later. Use the following code to set the index
and make it more efficient.

```python
def parse_cohort_df(df):
    df = df.copy()
    df.cohort_month = pd.to_datetime(df.cohort_month)
    cohort_index = []
    for i in df.cohort_month.value_counts(sort=False):
        cohort_index.extend(list(range(i)))
    df['cohort_index'] = cohort_index
    df = df.set_index(['cohort_month', 'cohort_index'])
    cohort_size = df.groupby('cohort_month')['total_users'].first()
    label_index = df.index.levels[0].strftime("%b %d, %Y") + ' (n = ' + cohort_size.astype(str) + ')'
    df.index = df.index.set_levels([label_index, df.index.levels[1]])
    return df
```

The result will look like this:

|          cohort_month | cohort_index | total_users | month_number | percentage |
|----------------------:|-------------:|------------:|-------------:|-----------:|
| Jan 01, 2019 (n = 15) |            0 |          15 |            0 |        100 |
|                       |            1 |          15 |            2 |    6.66667 |
|                       |            2 |          15 |            8 |    6.66667 |
|                       |            3 |          15 |           10 |    13.3333 |
|                       |            4 |          15 |           12 |    6.66667 |

Then use this function to transform the parsed data above into wide format. This function will return 2 dataframes, one
for the
percentages, one for the total_users.

```python
def transform_into_cohort_shape(df):
    return df.percentage.unstack(1), df.month_number.unstack(1)
```

The result of the first 5 months for percentages will look like this:

| cohort_month\cohort_index |   0 |       1 |       2 |        3 |        4 |       5 |       6 |        7 |        8 |        9 |      10 |       11 |       12 |      13 |      14 |       15 |       16 |      17 |      18 |      19 |      20 |      21 |      22 |       23 |       24 |      25 |       26 |      27 |      28 |       29 |      30 |       31 |       32 |      33 |      34 |      35 |      36 |       37 |      38 |       39 |       40 |      41 |      42 |       43 |      44 |       45 |       46 |      47 |      48 |       49 |       50 |      51 |      52 |     53 |       54 |      55 |
|:--------------------------|----:|--------:|--------:|---------:|---------:|--------:|--------:|---------:|---------:|---------:|--------:|---------:|---------:|--------:|--------:|---------:|---------:|--------:|--------:|--------:|--------:|--------:|--------:|---------:|---------:|--------:|---------:|--------:|--------:|---------:|--------:|---------:|---------:|--------:|--------:|--------:|--------:|---------:|--------:|---------:|---------:|--------:|--------:|---------:|--------:|---------:|---------:|--------:|--------:|---------:|---------:|--------:|--------:|-------:|---------:|--------:|
| Jan 01, 2019 (n = 15)     | 100 | 6.66667 | 6.66667 |  13.3333 |  6.66667 | 6.66667 | 6.66667 |  6.66667 |  13.3333 |  6.66667 | 6.66667 |          |          |         |         |          |          |         |         |         |         |         |         |          |          |         |          |         |         |          |         |          |          |         |         |         |         |          |         |          |          |         |         |          |         |          |          |         |         |          |          |         |         |        |          |         |
| Feb 01, 2019 (n = 40)     | 100 |     2.5 |       5 |        5 |      2.5 |     2.5 |     2.5 |      2.5 |      2.5 |      2.5 |     7.5 |      2.5 |      7.5 |       5 |     2.5 |        5 |      2.5 |     2.5 |     2.5 |     2.5 |     2.5 |       5 |     2.5 |      2.5 |      2.5 |     2.5 |        5 |     2.5 |     2.5 |      2.5 |     2.5 |        5 |      2.5 |         |         |         |         |          |         |          |          |         |         |          |         |          |          |         |         |          |          |         |         |        |          |         |
| Mar 01, 2019 (n = 77)     | 100 |  2.5974 |  1.2987 |   1.2987 |   2.5974 |  1.2987 |  2.5974 |   2.5974 |   1.2987 |   1.2987 |  1.2987 |   3.8961 |   3.8961 |  1.2987 |  1.2987 |   3.8961 |   1.2987 |  3.8961 |  2.5974 |  3.8961 |  2.5974 |  2.5974 | 5.19481 |   1.2987 |   1.2987 |  1.2987 |   1.2987 |  1.2987 |  1.2987 |   2.5974 |  1.2987 |  5.19481 |   1.2987 |  3.8961 |  2.5974 |  1.2987 |  2.5974 |   1.2987 |  1.2987 |   1.2987 |   1.2987 |  2.5974 |  2.5974 |   2.5974 |  3.8961 |   2.5974 |   1.2987 |  2.5974 |         |          |          |         |         |        |          |         |
| Apr 01, 2019 (n = 112)    | 100 | 4.46429 | 1.78571 |  3.57143 |  1.78571 | 1.78571 | 1.78571 | 0.892857 | 0.892857 | 0.892857 | 4.46429 | 0.892857 | 0.892857 | 1.78571 | 2.67857 |  2.67857 |  2.67857 | 3.57143 | 1.78571 | 2.67857 | 2.67857 | 1.78571 | 2.67857 |  3.57143 |  3.57143 | 1.78571 |  1.78571 | 2.67857 | 1.78571 | 0.892857 | 2.67857 |  2.67857 | 0.892857 | 2.67857 | 1.78571 | 3.57143 | 2.67857 | 0.892857 | 1.78571 |  3.57143 |  2.67857 | 1.78571 | 2.67857 | 0.892857 | 2.67857 | 0.892857 | 0.892857 | 2.67857 | 4.46429 |  2.67857 |  1.78571 | 1.78571 |         |        |          |         |
| May 01, 2019 (n = 151)    | 100 | 1.98675 | 2.64901 | 0.662252 | 0.662252 |  1.3245 | 1.98675 |   1.3245 |  1.98675 |  2.64901 | 1.98675 | 0.662252 | 0.662252 | 1.98675 | 2.64901 | 0.662252 | 0.662252 | 1.98675 | 2.64901 | 2.64901 | 1.98675 | 1.98675 | 1.98675 | 0.662252 | 0.662252 | 3.31126 | 0.662252 | 2.64901 | 1.98675 |  1.98675 | 2.64901 | 0.662252 | 0.662252 | 1.98675 | 1.98675 | 1.98675 | 3.31126 |   1.3245 |  1.3245 | 0.662252 | 0.662252 |  1.3245 | 2.64901 |   1.3245 | 3.31126 |  2.64901 |  1.98675 |  1.3245 | 3.31126 | 0.662252 | 0.662252 | 4.63576 | 3.31126 | 1.3245 | 0.662252 | 1.98675 |

Based on the table above, we can see that the percentage of users who made the first purchase in January 2019 stops at
month 10 with the same percentage in average. Another example in May 2019, the percentage of users who made the second
purchase 1 month after the first purchase is 1.99%. The percentage of users who made the third purchase 2 months after
the first purchase is 2.65%. And so on
up until the 55th month, the last month in the dataset, which is Feb 2024 shown in the table below.

| cohort_month            |   0 |       1 |       2 |       3 |       4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 |
|:------------------------|----:|--------:|--------:|--------:|--------:|--:|--:|--:|--:|--:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Oct 01, 2023 (n = 3022) | 100 | 7.51158 |  8.5043 | 7.90867 | 6.05559 |   |   |   |   |   |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| Nov 01, 2023 (n = 3031) | 100 | 11.1184 | 9.96371 |  6.5325 |         |   |   |   |   |   |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| Dec 01, 2023 (n = 3548) | 100 | 12.5705 | 9.13191 |         |         |   |   |   |   |   |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| Jan 01, 2024 (n = 4015) | 100 | 14.7198 |         |         |         |   |   |   |   |   |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| Feb 01, 2024 (n = 5468) | 100 |         |         |         |         |   |   |   |   |   |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |

To get a better picture, we remove the zeroth month as it is always 100 percent, and we can visualize the table with
pandas styling using the following code:

```python
cohort_percentage.iloc[:,1:].style.background_gradient(cmap='cool')
```

{% include cohort_analysis_table.html %}

From the visualized table above we can see that the magenta region, which shows higher percentage, tends to be in the
lower side of the table. This means that customers from earlier cohort are more likely to stay active over time. This is
a positive sign as it indicates good customer retention.

# Conclusion

In this project, I have performed customer segmentation based on demographic, RFM analysis, and Cohort analysis using
SQL and Pandas. The result shows that the majority of the customers are from China. The majority of the customers are
also in the age range of 46–60 and 31–45 years old with both genders are female. The RFM analysis shows that the best
customers are those who have the highest frequency and monetary value. The cohort analysis shows that the percentage of
active users tends to be higher in the earlier cohort. This is a positive sign as it indicates good customer retention.
