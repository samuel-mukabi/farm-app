-- Create a function to handle feed restocking atomically
create or replace function restock_feed_atomic(
  p_c1_bags int,
  p_c2_bags int,
  p_c3_bags int,
  p_action text,
  p_log_date timestamptz
) returns void as $$
declare
  v_bag_weight int := 50;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  -- 1. Insert into feed_logs
  insert into feed_logs (action, c1_bags, c2_bags, c3_bags, log_date)
  values (p_action, p_c1_bags, p_c2_bags, p_c3_bags, p_log_date);

  -- 2. Update stock for C1
  if p_c1_bags > 0 then
    insert into feed_types (name, current_stock_kg, user_id)
    values ('C1', p_c1_bags * v_bag_weight, v_user_id)
    on conflict (name, user_id) 
    do update set current_stock_kg = feed_types.current_stock_kg + (p_c1_bags * v_bag_weight);
  end if;

  -- 3. Update stock for C2
  if p_c2_bags > 0 then
    insert into feed_types (name, current_stock_kg, user_id)
    values ('C2', p_c2_bags * v_bag_weight, v_user_id)
    on conflict (name, user_id) 
    do update set current_stock_kg = feed_types.current_stock_kg + (p_c2_bags * v_bag_weight);
  end if;

  -- 4. Update stock for C3
  if p_c3_bags > 0 then
    insert into feed_types (name, current_stock_kg, user_id)
    values ('C3', p_c3_bags * v_bag_weight, v_user_id)
    on conflict (name, user_id) 
    do update set current_stock_kg = feed_types.current_stock_kg + (p_c3_bags * v_bag_weight);
  end if;

end;
$$ language plpgsql security definer;


-- Create a function to handle feed usage atomically
create or replace function log_feed_usage_atomic(
  p_crop_id uuid,
  p_c1_bags int,
  p_c2_bags int,
  p_c3_bags int,
  p_action text,
  p_log_date timestamptz
) returns void as $$
declare
  v_bag_weight int := 50;
  v_user_id uuid;
  v_total_kg int;
  v_c1_stock int;
  v_c2_stock int;
  v_c3_stock int;
begin
  v_user_id := auth.uid();
  v_total_kg := (p_c1_bags + p_c2_bags + p_c3_bags) * v_bag_weight;

  -- 1. Check stock availability
  if p_c1_bags > 0 then
    select current_stock_kg into v_c1_stock from feed_types where name = 'C1' and user_id = v_user_id;
    if (v_c1_stock is null) or (v_c1_stock < (p_c1_bags * v_bag_weight)) then
      raise exception 'Insufficient stock for C1';
    end if;
  end if;

  if p_c2_bags > 0 then
    select current_stock_kg into v_c2_stock from feed_types where name = 'C2' and user_id = v_user_id;
    if (v_c2_stock is null) or (v_c2_stock < (p_c2_bags * v_bag_weight)) then
      raise exception 'Insufficient stock for C2';
    end if;
  end if;

  if p_c3_bags > 0 then
    select current_stock_kg into v_c3_stock from feed_types where name = 'C3' and user_id = v_user_id;
    if (v_c3_stock is null) or (v_c3_stock < (p_c3_bags * v_bag_weight)) then
      raise exception 'Insufficient stock for C3';
    end if;
  end if;


  -- 2. Insert into feed_logs
  insert into feed_logs (crop_id, action, c1_bags, c2_bags, c3_bags, log_date)
  values (p_crop_id, p_action, p_c1_bags, p_c2_bags, p_c3_bags, p_log_date);

  -- 3. Deduct stock
  if p_c1_bags > 0 then
    update feed_types set current_stock_kg = current_stock_kg - (p_c1_bags * v_bag_weight)
    where name = 'C1' and user_id = v_user_id;
  end if;

  if p_c2_bags > 0 then
    update feed_types set current_stock_kg = current_stock_kg - (p_c2_bags * v_bag_weight)
    where name = 'C2' and user_id = v_user_id;
  end if;

  if p_c3_bags > 0 then
    update feed_types set current_stock_kg = current_stock_kg - (p_c3_bags * v_bag_weight)
    where name = 'C3' and user_id = v_user_id;
  end if;

  -- 4. Update daily_logs if crop_id is provided
  if p_crop_id is not null then
    insert into daily_logs (crop_id, log_date, feed_consumed_kg, mortality) -- Assuming mortality defaults to 0 if not provided
    values (p_crop_id, (p_log_date at time zone 'UTC')::date, v_total_kg, 0)
    on conflict (crop_id, log_date)
    do update set feed_consumed_kg = daily_logs.feed_consumed_kg + v_total_kg;
  end if;

end;
$$ language plpgsql security definer;
