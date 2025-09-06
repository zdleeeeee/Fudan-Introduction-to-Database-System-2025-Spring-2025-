本次实验测试用命令：

```postgresql
\c similarity

\timing

SET block_nested_loop_size = 1;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 2;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 8;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 4;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 16;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 32;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
```

